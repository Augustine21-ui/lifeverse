import { query } from './db.js';

// Get or create conversation between student and adult
const getOrCreateConversation = async (studentId, adultId) => {
  let conv = await query('SELECT id FROM conversations WHERE student_id = $1 AND adult_id = $2', [studentId, adultId]);
  if (conv.rows.length === 0) {
    conv = await query('INSERT INTO conversations (student_id, adult_id) VALUES ($1, $2) RETURNING id', [studentId, adultId]);
    return conv.rows[0].id;
  }
  return conv.rows[0].id;
};

// Send message
export const sendMessage = async (req, res) => {
  const userId = req.user.id;
  const { toUserId, content } = req.body;
  if (!toUserId || !content) return res.status(400).json({ error: 'Missing fields' });
  try {
    // Determine roles: if sender is student, toUserId must be adult (parent/teacher) and must be connected
    // For simplicity, we'll assume the connection already exists.
    const userRole = req.user.role;
    let studentId, adultId;
    if (userRole === 'student') {
      studentId = userId;
      adultId = toUserId;
    } else if (userRole === 'parent' || userRole === 'teacher') {
      studentId = toUserId;
      adultId = userId;
    } else {
      return res.status(403).json({ error: 'Invalid role' });
    }
    // Verify connection exists
    const conn = await query('SELECT id FROM parent_student WHERE parent_id = $1 AND student_id = $2 UNION SELECT id FROM teacher_student WHERE teacher_id = $1 AND student_id = $2', [adultId, studentId]);
    if (conn.rows.length === 0) return res.status(403).json({ error: 'Not connected' });
    const convId = await getOrCreateConversation(studentId, adultId);
    await query('INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3)', [convId, userId, content]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get messages for current user (with all conversation partners)
export const getMessages = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  try {
    let conversations;
    if (role === 'student') {
      conversations = await query(`
        SELECT c.id, c.adult_id, u.full_name as partner_name, u.role as partner_role,
          (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
        FROM conversations c
        JOIN users u ON c.adult_id = u.id
        WHERE c.student_id = $1
      `, [userId]);
    } else if (role === 'parent' || role === 'teacher') {
      conversations = await query(`
        SELECT c.id, c.student_id, u.full_name as partner_name, u.role as partner_role,
          (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
        FROM conversations c
        JOIN users u ON c.student_id = u.id
        WHERE c.adult_id = $1
      `, [userId]);
    } else {
      return res.status(403).json({ error: 'Invalid role' });
    }
    // For each conversation, fetch full message history
    const result = [];
    for (const conv of conversations.rows) {
      const messages = await query(`
        SELECT m.*, u.full_name as sender_name
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = $1
        ORDER BY m.created_at ASC
      `, [conv.id]);
      result.push({
        conversationId: conv.id,
        partnerId: role === 'student' ? conv.adult_id : conv.student_id,
        partnerName: conv.partner_name,
        partnerRole: conv.partner_role,
        lastMessage: conv.last_message,
        messages: messages.rows
      });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};