// backend/src/controllers/parentsController.js
import pool from '../config/db.js';

// Get all children linked to this parent
export const getChildren = async (req, res) => {
  const parentId = req.user.id;
  try {
    const children = await pool.query(`
      SELECT u.id, u.full_name, u.username, u.xp, u.level,
        (SELECT COUNT(*) FROM orbit_sessions WHERE user_id = u.id AND status = 'completed') as sessions,
        (SELECT COUNT(*) FROM orbit_challenges WHERE user_id = u.id AND status = 'completed') as challenges
      FROM bridge_connections bc
      JOIN users u ON bc.student_id = u.id
      WHERE bc.parent_id = $1 AND bc.status = 'active'
    `, [parentId]);
    res.json(children.rows);
  } catch (err) {
    console.error('getChildren error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get detailed progress for a specific child
export const getChildProgress = async (req, res) => {
  const childId = parseInt(req.params.id);
  const parentId = req.user.id;

  // Verify that this child is linked to the parent
  const link = await pool.query(
    `SELECT id FROM bridge_connections WHERE parent_id = $1 AND student_id = $2 AND status = 'active'`,
    [parentId, childId]
  );
  if (link.rows.length === 0) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  try {
    // Fetch basic stats
    const progress = await pool.query(`
      SELECT 
        u.xp,
        u.level,
        (SELECT COUNT(*) FROM orbit_sessions WHERE user_id = u.id AND status = 'completed') as tasks,
        (SELECT COUNT(*) FROM orbit_challenges WHERE user_id = u.id AND status = 'completed') as challenges
      FROM users u
      WHERE u.id = $1
    `, [childId]);

    // Fetch weekly XP activity (from orbit_sessions)
    const weekly = await pool.query(`
      SELECT 
        DATE(completed_at) as date,
        SUM(xp_earned) as xp
      FROM orbit_sessions
      WHERE user_id = $1 AND status = 'completed' AND completed_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(completed_at)
      ORDER BY date DESC
    `, [childId]);

    res.json({
      ...progress.rows[0],
      weekly: weekly.rows
    });
  } catch (err) {
    console.error('getChildProgress error:', err);
    res.status(500).json({ error: err.message });
  }
};