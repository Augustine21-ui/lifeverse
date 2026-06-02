import { query } from './db.js';

export const getStudents = async (req, res) => {
  const teacherId = req.user.id;
  try {
    const students = await query(`
      SELECT u.id, u.full_name, u.username, u.xp, u.level,
        (SELECT COUNT(*) FROM tasks WHERE user_id = u.id AND is_completed = true) as tasks,
        (SELECT COUNT(*) FROM user_challenges WHERE user_id = u.id AND status = 'completed') as challenges
      FROM teacher_student ts
      JOIN users u ON ts.student_id = u.id
      WHERE ts.teacher_id = $1
    `, [teacherId]);
    res.json(students.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getStudentProgressForTeacher = async (req, res) => {
  const studentId = parseInt(req.params.id);
  const teacherId = req.user.id;
  const link = await query('SELECT id FROM teacher_student WHERE teacher_id = $1 AND student_id = $2', [teacherId, studentId]);
  if (link.rows.length === 0) return res.status(403).json({ error: 'Not authorized' });
  try {
    const progress = await query(`
      SELECT 
        (SELECT xp FROM users WHERE id = $1) as xp,
        (SELECT level FROM users WHERE id = $1) as level,
        (SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND is_completed = true) as tasks,
        (SELECT COUNT(*) FROM user_challenges WHERE user_id = $1 AND status = 'completed') as challenges
    `, [studentId]);
    // Weekly activity data for chart
    const weekly = await query(`
      SELECT DATE(created_at) as date, SUM(xp_awarded) as xp
      FROM (
        SELECT created_at, xp_awarded FROM mood_entries WHERE user_id = $1
        UNION ALL
        SELECT updated_at, xp_reward FROM tasks WHERE user_id = $1 AND is_completed = true
        UNION ALL
        SELECT completed_at, xp_awarded FROM focus_sessions WHERE user_id = $1
      ) as activities
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [studentId]);
    res.json({ ...progress.rows[0], weekly: weekly.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getClassSummary = async (req, res) => {
  const teacherId = req.user.id;
  try {
    const summary = await query(`
      SELECT 
        COUNT(DISTINCT student_id) as total_students,
        AVG(xp) as avg_xp,
        AVG(level) as avg_level,
        SUM(CASE WHEN streak_days >= 7 THEN 1 ELSE 0 END) as active_7d
      FROM (
        SELECT ts.student_id, u.xp, u.level,
          (SELECT COUNT(*) FROM (
            SELECT DISTINCT DATE(created_at) FROM mood_entries WHERE user_id = ts.student_id
            UNION
            SELECT DISTINCT DATE(updated_at) FROM tasks WHERE user_id = ts.student_id AND is_completed = true
            UNION
            SELECT DISTINCT DATE(completed_at) FROM focus_sessions WHERE user_id = ts.student_id
          ) as dates) as streak_days
        FROM teacher_student ts
        JOIN users u ON ts.student_id = u.id
        WHERE ts.teacher_id = $1
      ) sub
    `, [teacherId]);
    res.json(summary.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};