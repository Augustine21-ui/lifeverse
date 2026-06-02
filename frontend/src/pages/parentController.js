import { query } from './db.js';

export const getChildren = async (req, res) => {
  const parentId = req.user.id;
  try {
    const children = await query(`
      SELECT u.id, u.full_name, u.username, u.xp, u.level,
        (SELECT COUNT(*) FROM tasks WHERE user_id = u.id AND is_completed = true) as tasks,
        (SELECT COUNT(*) FROM user_challenges WHERE user_id = u.id AND status = 'completed') as challenges
      FROM parent_student ps
      JOIN users u ON ps.student_id = u.id
      WHERE ps.parent_id = $1
    `, [parentId]);
    res.json(children.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getChildProgress = async (req, res) => {
  const childId = parseInt(req.params.id);
  const parentId = req.user.id;
  // Verify that this child is linked to the parent
  const link = await query('SELECT id FROM parent_student WHERE parent_id = $1 AND student_id = $2', [parentId, childId]);
  if (link.rows.length === 0) return res.status(403).json({ error: 'Not authorized' });
  try {
    const progress = await query(`
      SELECT 
        (SELECT xp FROM users WHERE id = $1) as xp,
        (SELECT level FROM users WHERE id = $1) as level,
        (SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND is_completed = true) as tasks,
        (SELECT COUNT(*) FROM user_challenges WHERE user_id = $1 AND status = 'completed') as challenges
    `, [childId]);
    // Also fetch weekly XP data (for charts)
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
    `, [childId]);
    res.json({ ...progress.rows[0], weekly: weekly.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};