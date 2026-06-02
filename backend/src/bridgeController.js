import { query } from './db.js';

// Get student's own progress
export const getStudentProgress = async (req, res) => {
  const userId = req.user.id;
  try {
    const userRes = await query('SELECT xp, level FROM users WHERE id = $1', [userId]);
    const xp = userRes.rows[0]?.xp || 0;
    const level = userRes.rows[0]?.level || 1;
    const tasksCompleted = await query('SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND is_completed = true', [userId]);
    const challengesCompleted = await query('SELECT COUNT(*) FROM user_challenges WHERE user_id = $1 AND status = $2', [userId, 'approved']);
    res.json({
      xp, level,
      tasks: parseInt(tasksCompleted.rows[0].count),
      challenges: parseInt(challengesCompleted.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Teacher: get list of linked students
export const getTeacherStudents = async (req, res) => {
  const teacherId = req.user.id;
  try {
    const students = await query(`
      SELECT u.id, u.full_name, u.username, u.xp, u.level
      FROM teacher_student ts
      JOIN users u ON ts.student_id = u.id
      WHERE ts.teacher_id = $1
    `, [teacherId]);
    res.json(students.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const generateConnectionCode = async (req, res) => {
  const userId = req.user.id;
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  await query('UPDATE users SET connection_code = $1 WHERE id = $2', [code, userId]);
  res.json({ code });
};

export const linkStudent = async (req, res) => {
  const userId = req.user.id;
  const { code } = req.body;
  const studentRes = await query('SELECT id FROM users WHERE connection_code = $1', [code]);
  if (studentRes.rows.length === 0) return res.status(404).json({ error: 'Invalid code' });
  const studentId = studentRes.rows[0].id;
  const role = req.user.role;
  let success = false;
  if (role === 'parent') {
    await query('INSERT INTO parent_student (parent_id, student_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, studentId]);
    // Create conversation
    await query('INSERT INTO conversations (student_id, adult_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [studentId, userId]);
    success = true;
  } else if (role === 'teacher') {
    await query('INSERT INTO teacher_student (teacher_id, student_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, studentId]);
    await query('INSERT INTO conversations (student_id, adult_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [studentId, userId]);
    success = true;
  }
  if (success) {
    res.json({ success: true });
  } else {
    res.status(403).json({ error: 'Invalid role' });
  }
};

// Parent: get linked child
export const getParentChild = async (req, res) => {
  const parentId = req.user.id;
  try {
    const child = await query(`
      SELECT u.id, u.full_name, u.username, u.xp, u.level
      FROM parent_student ps
      JOIN users u ON ps.student_id = u.id
      WHERE ps.parent_id = $1
    `, [parentId]);
    res.json(child.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get progress for a specific student (for parent/teacher)
export const getStudentProgressById = async (req, res) => {
  const studentId = parseInt(req.params.id);
  try {
    const userRes = await query('SELECT xp, level FROM users WHERE id = $1', [studentId]);
    if (!userRes.rows.length) return res.status(404).json({ error: 'Student not found' });
    const xp = userRes.rows[0].xp;
    const level = userRes.rows[0].level;
    const tasksCompleted = await query('SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND is_completed = true', [studentId]);
    const challengesCompleted = await query('SELECT COUNT(*) FROM user_challenges WHERE user_id = $1 AND status = $2', [studentId, 'approved']);
    res.json({
      xp, level,
      tasks: parseInt(tasksCompleted.rows[0].count),
      challenges: parseInt(challengesCompleted.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get announcements for the user's role(s)
export const getAnnouncements = async (req, res) => {
  const userRole = req.user.role || 'student';
  try {
    const announcements = await query(`
      SELECT a.*, u.full_name as author_name
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      WHERE $1 = ANY(a.target_roles)
      ORDER BY a.created_at DESC
    `, [userRole]);
    res.json(announcements.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create announcement (for teachers/admins – we'll restrict by role)
export const createAnnouncement = async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  if (userRole !== 'teacher') return res.status(403).json({ error: 'Only teachers can post announcements' });
  const { targetRoles, title, content } = req.body;
  if (!targetRoles || !title || !content) return res.status(400).json({ error: 'Missing fields' });
  try {
    await query('INSERT INTO announcements (author_id, target_roles, title, content) VALUES ($1, $2, $3, $4)', [userId, targetRoles, title, content]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};