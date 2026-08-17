// backend/src/bridgeMessageController.js
import pool from './config/db.js';

// Helper function to generate unique ID for conversations
const generateId = () => {
  return Date.now().toString() + '-' + Math.random().toString(36).substring(2, 6);
};

// Get or create a conversation between two users
const getOrCreateConversation = async (user1Id, user2Id) => {
  // Check if conversation already exists
  let conv = await pool.query(
    `SELECT id FROM bridge_conversations 
     WHERE (user1_id = $1 AND user2_id = $2) 
     OR (user1_id = $2 AND user2_id = $1)`,
    [user1Id, user2Id]
  );
  
  if (conv.rows.length === 0) {
    // Create new conversation
    conv = await pool.query(
      `INSERT INTO bridge_conversations (user1_id, user2_id) 
       VALUES ($1, $2) RETURNING id`,
      [user1Id, user2Id]
    );
    return conv.rows[0].id;
  }
  return conv.rows[0].id;
};

// Check if users are connected
const checkConnection = async (userId1, userId2, role) => {
  let queryStr;
  if (role === 'student') {
    // Student checking connection to teacher/parent
    queryStr = `
      SELECT * FROM bridge_connections 
      WHERE student_id = $1 
      AND (teacher_id = $2 OR parent_id = $2) 
      AND status = 'active'
    `;
  } else if (role === 'teacher' || role === 'parent') {
    // Teacher/Parent checking connection to student
    const column = role === 'teacher' ? 'teacher_id' : 'parent_id';
    queryStr = `
      SELECT * FROM bridge_connections 
      WHERE ${column} = $1 
      AND student_id = $2 
      AND status = 'active'
    `;
  } else {
    return false;
  }
  
  const result = await pool.query(queryStr, [userId1, userId2]);
  return result.rows.length > 0;
};

// ============================================================
// SEND MESSAGE
// ============================================================
export const sendMessage = async (req, res) => {
  const userId = req.user.id;
  let { toUserId, content } = req.body;
  toUserId = parseInt(toUserId);
  
  if (isNaN(toUserId) || !content) {
    return res.status(400).json({ error: 'Invalid toUserId or content' });
  }
  
  try {
    const userRole = req.user.role;
    
    // Check if recipient exists
    const recipientRes = await pool.query('SELECT role FROM users WHERE id = $1', [toUserId]);
    if (recipientRes.rows.length === 0) {
      return res.status(404).json({ error: 'Recipient not found' });
    }
    
    const recipientRole = recipientRes.rows[0].role;
    let conversationId;

    // Handle different role combinations
    if (userRole === 'student') {
      // Student -> Teacher/Parent
      const isConnected = await checkConnection(userId, toUserId, 'student');
      if (!isConnected) {
        return res.status(403).json({ error: 'Not connected to this user' });
      }
      conversationId = await getOrCreateConversation(userId, toUserId);
      await pool.query(
        `INSERT INTO bridge_messages (conversation_id, sender_id, receiver_id, content) 
         VALUES ($1, $2, $3, $4)`,
        [conversationId, userId, toUserId, content]
      );
      
    } else if (userRole === 'parent' || userRole === 'teacher') {
      if (recipientRole === 'student') {
        // Teacher/Parent -> Student
        const isConnected = await checkConnection(userId, toUserId, userRole);
        if (!isConnected) {
          return res.status(403).json({ error: 'Not connected to this student' });
        }
        conversationId = await getOrCreateConversation(toUserId, userId);
        await pool.query(
          `INSERT INTO bridge_messages (conversation_id, sender_id, receiver_id, content) 
           VALUES ($1, $2, $3, $4)`,
          [conversationId, userId, toUserId, content]
        );
      } else {
        // Teacher/Parent -> Teacher/Parent (peer)
        conversationId = await getOrCreateConversation(userId, toUserId);
        await pool.query(
          `INSERT INTO bridge_messages (conversation_id, sender_id, receiver_id, content) 
           VALUES ($1, $2, $3, $4)`,
          [conversationId, userId, toUserId, content]
        );
      }
    } else {
      return res.status(403).json({ error: 'Invalid role' });
    }
    
    res.json({ success: true, messageId: conversationId });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// GET CONVERSATIONS - FIXED: removed c.student_id
// ============================================================
export const getConversations = async (req, res) => {
  const userId = req.user.id;
  
  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        CASE 
          WHEN c.user1_id = $1 THEN c.user2_id 
          ELSE c.user1_id 
        END as partner_id,
        u.full_name as partner_name,
        u.role as partner_role,
        (
          SELECT content FROM bridge_messages 
          WHERE conversation_id = c.id 
          ORDER BY created_at DESC 
          LIMIT 1
        ) as last_message,
        (
          SELECT COUNT(*) FROM bridge_messages 
          WHERE conversation_id = c.id AND receiver_id = $1 AND read = FALSE
        ) as unread_count
      FROM bridge_conversations c
      JOIN users u ON (
        (c.user1_id = $1 AND u.id = c.user2_id) OR 
        (c.user2_id = $1 AND u.id = c.user1_id)
      )
      WHERE c.user1_id = $1 OR c.user2_id = $1
      ORDER BY (
        SELECT created_at FROM bridge_messages 
        WHERE conversation_id = c.id 
        ORDER BY created_at DESC 
        LIMIT 1
      ) DESC NULLS LAST
    `, [userId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Get conversations error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// GET MESSAGES BY CONVERSATION
// ============================================================
export const getMessagesByConversation = async (req, res) => {
  const userId = req.user.id;
  const { conversationId } = req.params;
  
  try {
    // Check if user has access to this conversation
    const accessCheck = await pool.query(
      `SELECT * FROM bridge_conversations 
       WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)`,
      [conversationId, userId]
    );
    
    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to view this conversation' });
    }
    
    // Get messages
    const messages = await pool.query(`
      SELECT 
        m.*,
        u.full_name as sender_name,
        u.role as sender_role
      FROM bridge_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at ASC
    `, [conversationId]);
    
    // Mark messages as read
    await pool.query(
      `UPDATE bridge_messages 
       SET read = TRUE, read_at = NOW() 
       WHERE conversation_id = $1 AND receiver_id = $2 AND read = FALSE`,
      [conversationId, userId]
    );
    
    res.json(messages.rows);
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// GET PEER CONTACTS
// ============================================================
export const getPeerContacts = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  
  if (role !== 'parent' && role !== 'teacher') {
    return res.status(403).json({ error: 'Not allowed' });
  }
  
  try {
    let contacts = [];
    
    if (role === 'teacher') {
      const result = await pool.query(`
        SELECT DISTINCT 
          u.id, u.full_name, u.username, u.role
        FROM bridge_connections bc1
        JOIN bridge_connections bc2 ON bc1.student_id = bc2.student_id
        JOIN users u ON bc2.parent_id = u.id
        WHERE bc1.teacher_id = $1 
        AND bc1.status = 'active' 
        AND bc2.status = 'active'
        AND bc2.parent_id IS NOT NULL
      `, [userId]);
      contacts = result.rows;
    } else {
      const result = await pool.query(`
        SELECT DISTINCT 
          u.id, u.full_name, u.username, u.role
        FROM bridge_connections bc1
        JOIN bridge_connections bc2 ON bc1.student_id = bc2.student_id
        JOIN users u ON bc2.teacher_id = u.id
        WHERE bc1.parent_id = $1 
        AND bc1.status = 'active' 
        AND bc2.status = 'active'
        AND bc2.teacher_id IS NOT NULL
      `, [userId]);
      contacts = result.rows;
    }
    
    res.json(contacts);
  } catch (err) {
    console.error('Get peer contacts error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// GET OR CREATE PEER CONVERSATION
// ============================================================
export const getOrCreatePeerConversation = async (req, res) => {
  const currentUserId = req.user.id;
  const otherUserId = parseInt(req.params.userId);
  
  if (isNaN(otherUserId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  
  try {
    const conversationId = await getOrCreateConversation(currentUserId, otherUserId);
    
    const messages = await pool.query(`
      SELECT 
        m.*,
        u.full_name as sender_name,
        u.role as sender_role
      FROM bridge_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at ASC
    `, [conversationId]);
    
    res.json({ 
      conversationId, 
      messages: messages.rows 
    });
  } catch (err) {
    console.error('Get or create peer conversation error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// GET MESSAGES (Legacy - keeping for compatibility)
// ============================================================
export const getMessages = async (req, res) => {
  const userId = req.user.id;
  
  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        CASE 
          WHEN c.user1_id = $1 THEN c.user2_id 
          ELSE c.user1_id 
        END as partner_id,
        u.full_name as partner_name,
        u.role as partner_role,
        (
          SELECT content FROM bridge_messages 
          WHERE conversation_id = c.id 
          ORDER BY created_at DESC 
          LIMIT 1
        ) as last_message,
        (
          SELECT COUNT(*) FROM bridge_messages 
          WHERE conversation_id = c.id AND receiver_id = $1 AND read = FALSE
        ) as unread_count
      FROM bridge_conversations c
      JOIN users u ON (
        (c.user1_id = $1 AND u.id = c.user2_id) OR 
        (c.user2_id = $1 AND u.id = c.user1_id)
      )
      WHERE c.user1_id = $1 OR c.user2_id = $1
      ORDER BY (
        SELECT created_at FROM bridge_messages 
        WHERE conversation_id = c.id 
        ORDER BY created_at DESC 
        LIMIT 1
      ) DESC NULLS LAST
    `, [userId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// MARK MESSAGE AS READ
// ============================================================
export const markMessageAsRead = async (req, res) => {
  const userId = req.user.id;
  const { messageId } = req.params;
  
  try {
    const check = await pool.query(
      `SELECT * FROM bridge_messages 
       WHERE id = $1 AND receiver_id = $2`,
      [messageId, userId]
    );
    
    if (check.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to mark this message as read' });
    }
    
    await pool.query(
      `UPDATE bridge_messages 
       SET read = TRUE, read_at = NOW() 
       WHERE id = $1`,
      [messageId]
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error('Mark message as read error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// GET UNREAD COUNT
// ============================================================
export const getUnreadCount = async (req, res) => {
  const userId = req.user.id;
  
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as unread_count 
       FROM bridge_messages 
       WHERE receiver_id = $1 AND read = FALSE`,
      [userId]
    );
    
    res.json({ unread_count: parseInt(result.rows[0].unread_count) });
  } catch (err) {
    console.error('Get unread count error:', err);
    res.status(500).json({ error: err.message });
  }
};