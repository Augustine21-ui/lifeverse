import { query } from './db.js';

export const sendMessage = async (req, res) => {
  const authorId = req.user.id;
  const { studentId, content } = req.body;
  if (!studentId || !content) return res.status(400).json({ error: 'Missing studentId or content' });
  try {
    // Verify that the author is connected to this student (parent or teacher)
    const isParent = await query('SELECT id FROM parent_student WHERE parent_id = $1 AND student_id = $2', [authorId, studentId]);
    const isTeacher = await query('SELECT id FROM teacher_student WHERE teacher_id = $1 AND student_id = $2', [authorId, studentId]);
    if (isParent.rows.length === 0 && isTeacher.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to message this student' });
    }
    const result = await query(
      'INSERT INTO bridge_messages (student_id, author_id, content) VALUES ($1, $2, $3) RETURNING *',
      [studentId, authorId, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMessages = async (req, res) => {
  const studentId = parseInt(req.params.id);
  const userId = req.user.id;
  try {
    // Allow the student themselves or any parent/teacher connected to them to view messages
    const isStudent = (userId === studentId);
    const isParent = await query('SELECT id FROM parent_student WHERE parent_id = $1 AND student_id = $2', [userId, studentId]);
    const isTeacher = await query('SELECT id FROM teacher_student WHERE teacher_id = $1 AND student_id = $2', [userId, studentId]);
    if (!isStudent && isParent.rows.length === 0 && isTeacher.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to view these messages' });
    }
    const messages = await query(`
      SELECT m.*, u.full_name as author_name, u.role as author_role
      FROM bridge_messages m
      JOIN users u ON m.author_id = u.id
      WHERE m.student_id = $1
      ORDER BY m.created_at ASC
    `, [studentId]);
    res.json(messages.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMessagesByConversation = async (req, res) => {
  const conversationId = parseInt(req.params.conversationId);
  const userId = req.user.id;
  try {
    // Verify user belongs to this conversation
    const conv = await query('SELECT student_id, adult_id FROM conversations WHERE id = $1', [conversationId]);
    if (conv.rows.length === 0) return res.status(404).json({ error: 'Conversation not found' });
    if (conv.rows[0].student_id !== userId && conv.rows[0].adult_id !== userId) return res.status(403).json({ error: 'Not authorized' });
    const messages = await query(`
      SELECT m.*, u.full_name as sender_name, u.role as sender_role
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at ASC
    `, [conversationId]);
    res.json(messages.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};