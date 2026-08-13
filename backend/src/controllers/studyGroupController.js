import db from '../config/db.js';

// Get all study groups the user is a member of
export const getMyStudyGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT g.*, 
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count,
        (SELECT COUNT(*) FROM group_focus_sessions WHERE group_id = g.id) as focus_sessions_count
       FROM groups g
       JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_id = $1 AND g.type = 'study'
       ORDER BY g.updated_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Get a single study group by ID
export const getStudyGroup = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const group = await db.query(
      `SELECT g.*, 
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count,
        (SELECT SUM(xp_contributed) FROM group_members WHERE group_id = g.id) as total_xp
       FROM groups g
       WHERE g.id = $1 AND g.type = 'study'`,
      [id]
    );
    if (group.rows.length === 0) return res.status(404).json({ error: 'Study group not found' });

    const members = await db.query(
      `SELECT u.id, u.full_name, u.username, gm.role, gm.xp_contributed, gm.focus_sessions_completed
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = $1
       ORDER BY gm.xp_contributed DESC`,
      [id]
    );

    const sessions = await db.query(
      `SELECT * FROM group_focus_sessions
       WHERE group_id = $1
       ORDER BY completed_at DESC
       LIMIT 10`,
      [id]
    );

    const resources = await db.query(
      `SELECT r.*, u.full_name as author_name
       FROM group_resources r
       JOIN users u ON r.user_id = u.id
       WHERE r.group_id = $1
       ORDER BY r.created_at DESC`,
      [id]
    );

    res.json({
      group: group.rows[0],
      members: members.rows,
      sessions: sessions.rows,
      resources: resources.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Create a study group
export const createStudyGroup = async (req, res) => {
  const { name, description, shared_goal, weekly_hours } = req.body;
  const userId = req.user.id;
  if (!name) return res.status(400).json({ error: 'Group name is required' });
  try {
    const result = await db.query(
      `INSERT INTO groups (name, description, type, shared_goal, weekly_hours, created_by)
       VALUES ($1, $2, 'study', $3, $4, $5)
       RETURNING *`,
      [name, description, shared_goal, weekly_hours || 10, userId]
    );
    await db.query(
      `INSERT INTO group_members (group_id, user_id, role)
       VALUES ($1, $2, 'admin')`,
      [result.rows[0].id, userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Join a study group
export const joinStudyGroup = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const existing = await db.query(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
      [id, userId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already a member' });
    }
    await db.query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
      [id, userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Log a focus session
export const logGroupFocus = async (req, res) => {
  const { id } = req.params;
  const { durationMinutes } = req.body;
  const userId = req.user.id;
  if (!durationMinutes) return res.status(400).json({ error: 'Duration is required' });
  try {
    await db.query(
      `INSERT INTO group_focus_sessions (group_id, user_id, duration_minutes)
       VALUES ($1, $2, $3)`,
      [id, userId, durationMinutes]
    );
    await db.query(
      `UPDATE group_members
       SET focus_sessions_completed = focus_sessions_completed + 1,
           xp_contributed = xp_contributed + $1
       WHERE group_id = $2 AND user_id = $3`,
      [durationMinutes, id, userId]
    );
    await db.query(
      `UPDATE groups
       SET total_xp = total_xp + $1,
           focus_sessions_count = focus_sessions_count + 1
       WHERE id = $2`,
      [durationMinutes, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Share a resource
export const shareResource = async (req, res) => {
  const { id } = req.params;
  const { title, description, url } = req.body;
  const userId = req.user.id;
  if (!title || !url) return res.status(400).json({ error: 'Title and URL are required' });
  try {
    const result = await db.query(
      `INSERT INTO group_resources (group_id, user_id, title, description, url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, userId, title, description, url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};