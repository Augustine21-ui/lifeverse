import { query } from './db.js';

// ==================== Existing functions ====================
export const getCommunities = async (req, res) => {
  try {
    const result = await query('SELECT * FROM communities ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCommunityById = async (req, res) => {
  const id = req.params.id; // UUID as string
  try {
    const result = await query('SELECT * FROM communities WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Community not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createCommunity = async (req, res) => {
  const userId = req.user.id;
  const { name, description, category, course, education_level } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const result = await query(
      `INSERT INTO communities (name, description, category, course, education_level, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description, category, course || null, education_level || null, userId]
    );
    // Automatically add creator as admin
    await query(
      'INSERT INTO community_members (community_id, user_id, role) VALUES ($1, $2, $3)',
      [result.rows[0].id, userId, 'admin']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const joinCommunity = async (req, res) => {
  const userId = req.user.id;
  const communityId = req.params.id; // UUID
  try {
    const existing = await query('SELECT id FROM community_members WHERE community_id = $1 AND user_id = $2', [communityId, userId]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Already a member' });
    await query('INSERT INTO community_members (community_id, user_id) VALUES ($1, $2)', [communityId, userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const leaveCommunity = async (req, res) => {
  const userId = req.user.id;
  const communityId = req.params.id; // UUID
  try {
    await query('DELETE FROM community_members WHERE community_id = $1 AND user_id = $2', [communityId, userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMyCommunities = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query(`
      SELECT c.*, cm.role, cm.joined_at
      FROM communities c
      JOIN community_members cm ON c.id = cm.community_id
      WHERE cm.user_id = $1
      ORDER BY cm.joined_at DESC
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==================== New group chat functions ====================
export const getCommunityMessages = async (req, res) => {
  const communityId = req.params.id; // UUID
  const userId = req.user.id;
  try {
    // Check if user is a member
    const member = await query('SELECT id FROM community_members WHERE community_id = $1 AND user_id = $2', [communityId, userId]);
    if (member.rows.length === 0) return res.status(403).json({ error: 'Not a member' });
    const messages = await query(`
      SELECT cm.*, u.full_name as sender_name, u.username
      FROM community_messages cm
      JOIN users u ON cm.sender_id = u.id
      WHERE cm.community_id = $1
      ORDER BY cm.created_at ASC
    `, [communityId]);
    res.json(messages.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const sendCommunityMessage = async (req, res) => {
  const userId = req.user.id;
  const communityId = req.params.id; // UUID
  const { content } = req.body;
  if (!content || content.trim() === '') return res.status(400).json({ error: 'Message content required' });
  try {
    const member = await query('SELECT id FROM community_members WHERE community_id = $1 AND user_id = $2', [communityId, userId]);
    if (member.rows.length === 0) return res.status(403).json({ error: 'Not a member' });
    const result = await query(
      'INSERT INTO community_messages (community_id, sender_id, content) VALUES ($1, $2, $3) RETURNING *',
      [communityId, userId, content]
    );
    const userInfo = await query('SELECT full_name, username FROM users WHERE id = $1', [userId]);
    const newMessage = { ...result.rows[0], sender_name: userInfo.rows[0].full_name, username: userInfo.rows[0].username };
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCommunityMembers = async (req, res) => {
  const communityId = req.params.id; // UUID
  const userId = req.user.id;
  try {
    const member = await query('SELECT id FROM community_members WHERE community_id = $1 AND user_id = $2', [communityId, userId]);
    if (member.rows.length === 0) return res.status(403).json({ error: 'Not a member' });
    const members = await query(`
      SELECT u.id, u.full_name, u.username, cm.role, cm.joined_at
      FROM community_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.community_id = $1
      ORDER BY cm.role DESC, u.full_name ASC
    `, [communityId]);
    res.json(members.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateMemberRole = async (req, res) => {
  const communityId = req.params.id; // UUID
  const userId = req.user.id;
  const { targetUserId, role } = req.body;
  if (!targetUserId || !role) return res.status(400).json({ error: 'Missing targetUserId or role' });
  if (!['admin', 'member'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  try {
    const adminCheck = await query('SELECT role FROM community_members WHERE community_id = $1 AND user_id = $2', [communityId, userId]);
    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') return res.status(403).json({ error: 'Only admins can change roles' });
    await query('UPDATE community_members SET role = $1 WHERE community_id = $2 AND user_id = $3', [role, communityId, targetUserId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
