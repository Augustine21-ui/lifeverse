import { query } from './db.js';

const getOrCreateConversation = async (studentId, adultId) => {
  let conv = await query('SELECT id FROM conversations WHERE student_id = $1 AND adult_id = $2', [studentId, adultId]);
  if (conv.rows.length === 0) {
    conv = await query('INSERT INTO conversations (student_id, adult_id) VALUES ($1, $2) RETURNING id', [studentId, adultId]);
    return conv.rows[0].id;
  }
  return conv.rows[0].id;
};

export const sendMessage = async (req, res) => {
  const userId = req.user.id;
  let { toUserId, content } = req.body;
  toUserId = parseInt(toUserId);
  if (isNaN(toUserId) || !content) return res.status(400).json({ error: 'Invalid toUserId or content' });
  try {
    const userRole = req.user.role;
    const recipientRes = await query('SELECT role FROM users WHERE id = $1', [toUserId]);
    if (recipientRes.rows.length === 0) return res.status(404).json({ error: 'Recipient not found' });
    const recipientRole = recipientRes.rows[0].role;

    if (userRole === 'student') {
      // Student -> adult
      const conn = await query('SELECT id FROM parent_student WHERE parent_id = $1 AND student_id = $2 UNION SELECT id FROM teacher_student WHERE teacher_id = $1 AND student_id = $2', [toUserId, userId]);
      if (conn.rows.length === 0) return res.status(403).json({ error: 'Not connected' });
      const conversationId = await getOrCreateConversation(userId, toUserId);
      await query('INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3)', [conversationId, userId, content]);
    } else if (userRole === 'parent' || userRole === 'teacher') {
      if (recipientRole === 'student') {
        // Adult -> student
        const conn = await query('SELECT id FROM parent_student WHERE parent_id = $1 AND student_id = $2 UNION SELECT id FROM teacher_student WHERE teacher_id = $1 AND student_id = $2', [userId, toUserId]);
        if (conn.rows.length === 0) return res.status(403).json({ error: 'Not connected' });
        const conversationId = await getOrCreateConversation(toUserId, userId);
        await query('INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3)', [conversationId, userId, content]);
      } else {
        // Adult -> adult (peer)
        let conv = await query(
          'SELECT id FROM peer_conversations WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)',
          [userId, toUserId]
        );
        if (conv.rows.length === 0) {
          conv = await query(
            'INSERT INTO peer_conversations (user1_id, user2_id) VALUES ($1, $2) RETURNING id',
            [userId, toUserId]
          );
        }
        const conversationId = conv.rows[0].id;
        await query('INSERT INTO peer_messages (conversation_id, sender_id, content) VALUES ($1, $2, $3)', [conversationId, userId, content]);
      }
    } else {
      return res.status(403).json({ error: 'Invalid role' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const getMessages = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  try {
    let conversations = [];
    if (role === 'student') {
      const result = await query(`
        SELECT c.id, c.adult_id as partner_id, u.full_name as partner_name, u.role as partner_role,
          (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
        FROM conversations c
        JOIN users u ON c.adult_id = u.id
        WHERE c.student_id = $1
        ORDER BY c.created_at DESC
      `, [userId]);
      conversations = result.rows;
    } else if (role === 'parent' || role === 'teacher') {
      const studentConvs = await query(`
        SELECT c.id, c.student_id as partner_id, u.full_name as partner_name, u.role as partner_role,
          (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
        FROM conversations c
        JOIN users u ON c.student_id = u.id
        WHERE c.adult_id = $1
        ORDER BY c.created_at DESC
      `, [userId]);
      const peerConvs = await query(`
        SELECT pc.id,
               CASE WHEN pc.user1_id = $1 THEN pc.user2_id ELSE pc.user1_id END as partner_id,
               u.full_name as partner_name,
               u.role as partner_role,
               (SELECT content FROM peer_messages WHERE conversation_id = pc.id ORDER BY created_at DESC LIMIT 1) as last_message
        FROM peer_conversations pc
        JOIN users u ON (CASE WHEN pc.user1_id = $1 THEN pc.user2_id ELSE pc.user1_id END) = u.id
        WHERE pc.user1_id = $1 OR pc.user2_id = $1
        ORDER BY pc.created_at DESC
      `, [userId]);
      conversations = [...studentConvs.rows, ...peerConvs.rows];
    } else {
      return res.status(403).json({ error: 'Invalid role' });
    }
    res.json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const getMessagesByConversation = async (req, res) => {
  const conversationId = parseInt(req.params.conversationId);
  const userId = req.user.id;
  try {
    let conv = await query('SELECT student_id, adult_id FROM conversations WHERE id = $1', [conversationId]);
    if (conv.rows.length === 0) {
      const peerConv = await query('SELECT user1_id, user2_id FROM peer_conversations WHERE id = $1', [conversationId]);
      if (peerConv.rows.length === 0) return res.status(404).json({ error: 'Conversation not found' });
      if (peerConv.rows[0].user1_id !== userId && peerConv.rows[0].user2_id !== userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      const messages = await query(`
        SELECT m.*, u.full_name as sender_name, u.role as sender_role
        FROM peer_messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = $1
        ORDER BY m.created_at ASC
      `, [conversationId]);
      res.json(messages.rows);
    } else {
      if (conv.rows[0].student_id !== userId && conv.rows[0].adult_id !== userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      const messages = await query(`
        SELECT m.*, u.full_name as sender_name, u.role as sender_role
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = $1
        ORDER BY m.created_at ASC
      `, [conversationId]);
      res.json(messages.rows);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const getPeerContacts = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  if (role !== 'parent' && role !== 'teacher') return res.status(403).json({ error: 'Not allowed' });
  try {
    let contacts = [];
    if (role === 'teacher') {
      const result = await query(`
        SELECT DISTINCT u.id, u.full_name, u.username, u.role
        FROM parent_student ps
        JOIN users u ON ps.parent_id = u.id
        JOIN teacher_student ts ON ps.student_id = ts.student_id
        WHERE ts.teacher_id = $1
      `, [userId]);
      contacts = result.rows;
    } else {
      const result = await query(`
        SELECT DISTINCT u.id, u.full_name, u.username, u.role
        FROM teacher_student ts
        JOIN users u ON ts.teacher_id = u.id
        JOIN parent_student ps ON ts.student_id = ps.student_id
        WHERE ps.parent_id = $1
      `, [userId]);
      contacts = result.rows;
    }
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOrCreatePeerConversation = async (req, res) => {
  const currentUserId = req.user.id;
  const otherUserId = parseInt(req.params.userId);
  if (isNaN(otherUserId)) return res.status(400).json({ error: 'Invalid user ID' });
  try {
    let conv = await query(
      'SELECT id FROM peer_conversations WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)',
      [currentUserId, otherUserId]
    );
    let conversationId;
    if (conv.rows.length === 0) {
      conv = await query(
        'INSERT INTO peer_conversations (user1_id, user2_id) VALUES ($1, $2) RETURNING id',
        [currentUserId, otherUserId]
      );
    }
    conversationId = conv.rows[0].id;
    const messages = await query(`
      SELECT m.*, u.full_name as sender_name, u.role as sender_role
      FROM peer_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at ASC
    `, [conversationId]);
    res.json({ conversationId, messages: messages.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
