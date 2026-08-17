import db from '../config/db.js';

// ============================================================
// FIXED FUNCTIONS - Using correct table names
// ============================================================

// Get student's own progress
export const getStudentProgress = async (req, res) => {
  const userId = req.user.id;
  try {
    const userRes = await db.query('SELECT xp, level FROM users WHERE id = $1', [userId]);
    const xp = userRes.rows[0]?.xp || 0;
    const level = userRes.rows[0]?.level || 1;
    const tasksCompleted = await db.query('SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND is_completed = true', [userId]);
    const challengesCompleted = await db.query('SELECT COUNT(*) FROM user_challenges WHERE user_id = $1 AND status = $2', [userId, 'approved']);
    res.json({
      xp, level,
      tasks: parseInt(tasksCompleted.rows[0].count),
      challenges: parseInt(challengesCompleted.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get teacher's students - FIXED to use bridge_connections
export const getTeacherStudents = async (req, res) => {
  const teacherId = req.user.id;
  try {
    const students = await db.query(`
      SELECT u.id, u.full_name, u.username, u.xp, u.level
      FROM bridge_connections bc
      JOIN users u ON bc.student_id = u.id
      WHERE bc.teacher_id = $1 AND bc.status = 'active'
    `, [teacherId]);
    res.json(students.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Generate connection code - FIXED to use bridge_codes
export const generateConnectionCode = async (req, res) => {
  const userId = req.user.id;
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  try {
    // Check if user already has an active code
    const existing = await db.query(
      'SELECT * FROM bridge_codes WHERE user_id = $1 AND expires_at > NOW() AND used = FALSE',
      [userId]
    );
    
    if (existing.rows.length > 0) {
      return res.json({ code: existing.rows[0].code });
    }
    
    // Generate new code
    await db.query(
      'INSERT INTO bridge_codes (code, user_id, type, expires_at) VALUES ($1, $2, $3, $4)',
      [code, userId, 'student', expiresAt]
    );
    res.json({ code });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Link student - FIXED to use bridge_connections
export const linkStudent = async (req, res) => {
  const userId = req.user.id;
  const { code } = req.body;
  
  try {
    // Find the code
    const codeRes = await db.query(
      'SELECT user_id FROM bridge_codes WHERE code = $1 AND expires_at > NOW() AND used = FALSE',
      [code]
    );
    
    if (codeRes.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired code' });
    }
    
    const studentId = codeRes.rows[0].user_id;
    const role = req.user.role;
    
    // Check if already connected
    let existingConnection;
    if (role === 'parent') {
      existingConnection = await db.query(
        'SELECT * FROM bridge_connections WHERE parent_id = $1 AND student_id = $2 AND status = $3',
        [userId, studentId, 'active']
      );
    } else if (role === 'teacher') {
      existingConnection = await db.query(
        'SELECT * FROM bridge_connections WHERE teacher_id = $1 AND student_id = $2 AND status = $3',
        [userId, studentId, 'active']
      );
    }
    
    if (existingConnection.rows.length > 0) {
      return res.status(400).json({ error: 'Already connected to this student' });
    }
    
    // Create connection
    let success = false;
    if (role === 'parent') {
      await db.query(
        'INSERT INTO bridge_connections (parent_id, student_id, status) VALUES ($1, $2, $3)',
        [userId, studentId, 'active']
      );
      success = true;
    } else if (role === 'teacher') {
      await db.query(
        'INSERT INTO bridge_connections (teacher_id, student_id, status) VALUES ($1, $2, $3)',
        [userId, studentId, 'active']
      );
      success = true;
    }
    
    // Mark code as used
    if (success) {
      await db.query(
        'UPDATE bridge_codes SET used = TRUE, used_by = $1, used_at = NOW() WHERE code = $2',
        [userId, code]
      );
      
      // Create conversation
      const conversationId = Date.now().toString() + '-' + Math.random().toString(36).substring(2, 6);
      await db.query(
        'INSERT INTO bridge_conversations (user1_id, user2_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, studentId]
      );
      
      res.json({ success: true });
    } else {
      res.status(403).json({ error: 'Invalid role' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Get parent's child - FIXED to use bridge_connections
export const getParentChild = async (req, res) => {
  const parentId = req.user.id;
  try {
    const child = await db.query(`
      SELECT u.id, u.full_name, u.username, u.xp, u.level
      FROM bridge_connections bc
      JOIN users u ON bc.student_id = u.id
      WHERE bc.parent_id = $1 AND bc.status = 'active'
    `, [parentId]);
    res.json(child.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get student progress by ID - FIXED to check permissions
export const getStudentProgressById = async (req, res) => {
  const studentId = parseInt(req.params.id);
  const viewerId = req.user.id;
  const viewerRole = req.user.role;
  
  try {
    // Check if viewer has access to this student
    let accessCheck;
    if (viewerRole === 'teacher') {
      accessCheck = await db.query(
        'SELECT * FROM bridge_connections WHERE teacher_id = $1 AND student_id = $2 AND status = $3',
        [viewerId, studentId, 'active']
      );
    } else if (viewerRole === 'parent') {
      accessCheck = await db.query(
        'SELECT * FROM bridge_connections WHERE parent_id = $1 AND student_id = $2 AND status = $3',
        [viewerId, studentId, 'active']
      );
    } else if (viewerRole === 'student' && viewerId === studentId) {
      // Students can view their own progress
      accessCheck = { rows: [{ id: studentId }] };
    }
    
    if (!accessCheck || accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const userRes = await db.query('SELECT xp, level FROM users WHERE id = $1', [studentId]);
    if (!userRes.rows.length) return res.status(404).json({ error: 'Student not found' });
    
    const xp = userRes.rows[0].xp;
    const level = userRes.rows[0].level;
    const tasksCompleted = await db.query('SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND is_completed = true', [studentId]);
    const challengesCompleted = await db.query('SELECT COUNT(*) FROM user_challenges WHERE user_id = $1 AND status = $2', [studentId, 'approved']);
    
    res.json({
      xp, level,
      tasks: parseInt(tasksCompleted.rows[0].count),
      challenges: parseInt(challengesCompleted.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get announcements
export const getAnnouncements = async (req, res) => {
  const userRole = req.user.role || 'student';
  try {
    const announcements = await db.query(`
      SELECT a.*, u.full_name as author_name
      FROM bridge_announcements a
      JOIN users u ON a.user_id = u.id
      WHERE $1 = ANY(a.target_roles) OR a.target_roles IS NULL
      ORDER BY a.created_at DESC
    `, [userRole]);
    res.json(announcements.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create announcement
export const createAnnouncement = async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  if (userRole !== 'teacher' && userRole !== 'admin') {
    return res.status(403).json({ error: 'Only teachers can post announcements' });
  }
  const { targetRoles, title, content } = req.body;
  if (!targetRoles || !title || !content) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  try {
    await db.query(
      'INSERT INTO bridge_announcements (user_id, target_roles, title, content) VALUES ($1, $2, $3, $4)',
      [userId, targetRoles, title, content]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// NEW BRIDGE FEATURES (with fixed table names)
// ============================================================

// ------- Helper -------
const createNotification = async (userId, type, title, content) => {
  try {
    await db.query(
      `INSERT INTO notifications (user_id, type, title, content) VALUES ($1, $2, $3, $4)`,
      [userId, type, title, content]
    );
  } catch (e) { /* ignore errors */ }
};

// ------- Privacy Settings -------
export const getPrivacySettings = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query('SELECT privacy_settings FROM users WHERE id = $1', [userId]);
    res.json(result.rows[0]?.privacy_settings || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updatePrivacySettings = async (req, res) => {
  const { privacySettings } = req.body;
  const userId = req.user.id;
  try {
    await db.query('UPDATE users SET privacy_settings = $1 WHERE id = $2', [privacySettings, userId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ------- Teacher: Report Cards -------
export const uploadReportCard = async (req, res) => {
  const { studentId, title, fileUrl } = req.body;
  const teacherId = req.user.id;
  if (!studentId || !title || !fileUrl) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  
  // Verify teacher is connected to this student
  const check = await db.query(
    'SELECT * FROM bridge_connections WHERE teacher_id = $1 AND student_id = $2 AND status = $3',
    [teacherId, studentId, 'active']
  );
  
  if (check.rows.length === 0) {
    return res.status(403).json({ error: 'Not connected to this student' });
  }
  
  try {
    await db.query(
      `INSERT INTO report_cards (student_id, title, file_url, uploaded_by)
       VALUES ($1, $2, $3, $4)`,
      [studentId, title, fileUrl, teacherId]
    );
    await createNotification(studentId, 'report_card', 'New report card uploaded', `Your report card for ${title} is ready.`);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ------- Teacher: Assignments -------
export const createAssignment = async (req, res) => {
  const { studentId, title, description, dueDate } = req.body;
  const teacherId = req.user.id;
  
  // Verify teacher is connected to this student
  const check = await db.query(
    'SELECT * FROM bridge_connections WHERE teacher_id = $1 AND student_id = $2 AND status = $3',
    [teacherId, studentId, 'active']
  );
  
  if (check.rows.length === 0) {
    return res.status(403).json({ error: 'Not connected to this student' });
  }
  
  try {
    await db.query(
      `INSERT INTO assignments (student_id, teacher_id, title, description, due_date)
       VALUES ($1, $2, $3, $4, $5)`,
      [studentId, teacherId, title, description, dueDate]
    );
    await createNotification(studentId, 'assignment', 'New assignment', `Assignment: ${title} is due on ${dueDate}`);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ------- Teacher: Feedback -------
export const giveFeedback = async (req, res) => {
  const { studentId, subject, content, grade } = req.body;
  const teacherId = req.user.id;
  
  // Verify teacher is connected to this student
  const check = await db.query(
    'SELECT * FROM bridge_connections WHERE teacher_id = $1 AND student_id = $2 AND status = $3',
    [teacherId, studentId, 'active']
  );
  
  if (check.rows.length === 0) {
    return res.status(403).json({ error: 'Not connected to this student' });
  }
  
  try {
    await db.query(
      `INSERT INTO academic_feedback (student_id, teacher_id, subject, content, grade)
       VALUES ($1, $2, $3, $4, $5)`,
      [studentId, teacherId, subject, content, grade]
    );
    await createNotification(studentId, 'feedback', 'Teacher feedback received', `Feedback on ${subject}: ${content}`);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ------- Student: Support Requests -------
export const createSupportRequest = async (req, res) => {
  const { recipientRole, recipientId, content } = req.body;
  const studentId = req.user.id;
  try {
    await db.query(
      `INSERT INTO support_requests (student_id, recipient_role, recipient_id, content)
       VALUES ($1, $2, $3, $4)`,
      [studentId, recipientRole, recipientId, content]
    );
    await createNotification(recipientId, 'support_request', 'Student needs support', content);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ------- Student: Reflections -------
export const createReflection = async (req, res) => {
  const { content, sharedWithRoles } = req.body;
  const studentId = req.user.id;
  try {
    await db.query(
      `INSERT INTO reflections (student_id, content, shared_with_roles)
       VALUES ($1, $2, $3)`,
      [studentId, content, sharedWithRoles || []]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ------- Encouragement Wall -------
export const sendEncouragement = async (req, res) => {
  const { studentId, content } = req.body;
  const senderId = req.user.id;
  
  // Verify sender is connected to this student
  const check = await db.query(
    'SELECT * FROM bridge_connections WHERE (teacher_id = $1 OR parent_id = $1) AND student_id = $2 AND status = $3',
    [senderId, studentId, 'active']
  );
  
  if (check.rows.length === 0) {
    return res.status(403).json({ error: 'Not connected to this student' });
  }
  
  try {
    await db.query(
      `INSERT INTO encouragement_wall (student_id, sender_id, content)
       VALUES ($1, $2, $3)`,
      [studentId, senderId, content]
    );
    await createNotification(studentId, 'encouragement', 'You received encouragement!', content);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const getEncouragementWall = async (req, res) => {
  const { studentId } = req.params;
  try {
    const result = await db.query(
      `SELECT e.*, u.full_name as sender_name
       FROM encouragement_wall e
       JOIN users u ON e.sender_id = u.id
       WHERE e.student_id = $1
       ORDER BY e.created_at DESC`,
      [studentId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ------- Parent Dashboard - FIXED -------
export const getParentChildProgress = async (req, res) => {
  const parentId = req.user.id;
  try {
    const child = await db.query(
      `SELECT u.id, u.full_name, u.xp, u.level, u.streak_days
       FROM bridge_connections bc
       JOIN users u ON bc.student_id = u.id
       WHERE bc.parent_id = $1 AND bc.status = 'active'`,
      [parentId]
    );
    
    if (child.rows.length === 0) {
      return res.json({ student: null, assignments: [], feedback: [], reportCards: [], encouragement: [], trends: [] });
    }

    const student = child.rows[0];
    const assignments = await db.query(
      `SELECT * FROM assignments WHERE student_id = $1 ORDER BY due_date DESC LIMIT 5`,
      [student.id]
    );
    const feedback = await db.query(
      `SELECT * FROM academic_feedback WHERE student_id = $1 ORDER BY created_at DESC LIMIT 5`,
      [student.id]
    );
    const reportCards = await db.query(
      `SELECT * FROM report_cards WHERE student_id = $1 ORDER BY uploaded_at DESC LIMIT 3`,
      [student.id]
    );
    const encouragement = await db.query(
      `SELECT * FROM encouragement_wall WHERE student_id = $1 ORDER BY created_at DESC LIMIT 5`,
      [student.id]
    );

    // Simple subject trends (mock – you can replace with real data)
    const subjects = ['Mathematics', 'Science', 'English'];
    const trends = subjects.map(s => ({
      subject: s,
      trend: Math.random() > 0.5 ? 'Improving' : Math.random() > 0.3 ? 'Stable' : 'Needs Attention'
    }));

    res.json({
      student,
      assignments: assignments.rows,
      feedback: feedback.rows,
      reportCards: reportCards.rows,
      encouragement: encouragement.rows,
      trends,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ------- Notifications -------
export const getNotifications = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const markNotificationRead = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE notifications SET is_read = TRUE WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};