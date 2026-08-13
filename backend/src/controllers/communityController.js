import pool from '../config/db.js';
import { awardXP, checkAndAwardBadges } from '../models/xp.js';

export const getCommunities = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const result = await pool.query(`
      SELECT c.*,
        CASE WHEN cm.user_id IS NOT NULL THEN true ELSE false END as is_member
      FROM communities c
      LEFT JOIN community_members cm ON cm.community_id=c.id AND cm.user_id=$1
      ORDER BY c.is_official DESC, c.member_count DESC
    `, [userId || null]);
    res.json({ communities: result.rows });
  } catch (err) { next(err); }
};

export const joinCommunity = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query(
      'INSERT INTO community_members (community_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [id, req.user.id]
    );
    await pool.query('UPDATE communities SET member_count=member_count+1 WHERE id=$1', [id]);
    await checkAndAwardBadges(req.user.id);
    res.json({ message: 'Joined community' });
  } catch (err) { next(err); }
};

export const leaveCommunity = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM community_members WHERE community_id=$1 AND user_id=$2', [id, req.user.id]);
    await pool.query('UPDATE communities SET member_count=GREATEST(0,member_count-1) WHERE id=$1', [id]);
    res.json({ message: 'Left community' });
  } catch (err) { next(err); }
};

export const getPosts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const result = await pool.query(`
      SELECT p.*,
        u.username, u.full_name, u.avatar_url, u.level,
        CASE WHEN pl.user_id IS NOT NULL THEN true ELSE false END as is_liked
      FROM posts p
      JOIN users u ON u.id=p.user_id
      LEFT JOIN post_likes pl ON pl.post_id=p.id AND pl.user_id=$2
      WHERE p.community_id=$1
      ORDER BY p.created_at DESC LIMIT 50
    `, [id, userId || null]);
    res.json({ posts: result.rows });
  } catch (err) { next(err); }
};

export const createPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const isMember = await pool.query('SELECT 1 FROM community_members WHERE community_id=$1 AND user_id=$2', [id, req.user.id]);
    if (!isMember.rows[0]) return res.status(403).json({ error: 'Join this community to post' });

    const result = await pool.query(
      'INSERT INTO posts (community_id, user_id, content) VALUES ($1,$2,$3) RETURNING *',
      [id, req.user.id, content]
    );
    await awardXP(req.user.id, 15, 'post_created', result.rows[0].id);
    await checkAndAwardBadges(req.user.id);

    const post = await pool.query(`
      SELECT p.*, u.username, u.full_name, u.avatar_url, u.level
      FROM posts p JOIN users u ON u.id=p.user_id WHERE p.id=$1
    `, [result.rows[0].id]);

    res.status(201).json({ post: post.rows[0] });
  } catch (err) { next(err); }
};

export const likePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const existing = await pool.query('SELECT 1 FROM post_likes WHERE post_id=$1 AND user_id=$2', [postId, req.user.id]);

    if (existing.rows[0]) {
      await pool.query('DELETE FROM post_likes WHERE post_id=$1 AND user_id=$2', [postId, req.user.id]);
      await pool.query('UPDATE posts SET likes_count=GREATEST(0,likes_count-1) WHERE id=$1', [postId]);
      res.json({ liked: false });
    } else {
      await pool.query('INSERT INTO post_likes (post_id, user_id) VALUES ($1,$2)', [postId, req.user.id]);
      await pool.query('UPDATE posts SET likes_count=likes_count+1 WHERE id=$1', [postId]);
      res.json({ liked: true });
    }
  } catch (err) { next(err); }
};
// ============================================
// STUDY GROUP – ACTIVE WORKSPACE
// ============================================

// Get study group details with progress
export const getStudyGroup = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const group = await db.query(`
      SELECT g.*, 
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count,
        (SELECT SUM(xp_contributed) FROM group_members WHERE group_id = g.id) as total_group_xp,
        (SELECT AVG(focus_sessions_completed) FROM group_members WHERE group_id = g.id) as avg_sessions
      FROM groups g
      WHERE g.id = $1 AND g.type = 'study'
    `, [id]);
    if (group.rows.length === 0) return res.status(404).json({ error: 'Study group not found' });

    // Get members with their XP contribution
    const members = await db.query(`
      SELECT u.id, u.full_name, u.username, gm.xp_contributed, gm.focus_sessions_completed
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = $1
      ORDER BY gm.xp_contributed DESC
    `, [id]);

    // Get recent focus sessions
    const sessions = await db.query(`
      SELECT * FROM group_focus_sessions
      WHERE group_id = $1
      ORDER BY completed_at DESC
      LIMIT 10
    `, [id]);

    res.json({ group: group.rows[0], members: members.rows, sessions: sessions.rows });
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
    await db.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, userId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Log a focus session for a study group
export const logGroupFocus = async (req, res) => {
  const { id } = req.params; // group id
  const { durationMinutes } = req.body;
  const userId = req.user.id;
  try {
    await db.query(
      `INSERT INTO group_focus_sessions (group_id, user_id, duration_minutes, completed_at)
       VALUES ($1, $2, $3, NOW())`,
      [id, userId, durationMinutes]
    );
    // Update user's contribution
    await db.query(
      `UPDATE group_members SET focus_sessions_completed = focus_sessions_completed + 1,
       xp_contributed = xp_contributed + $1
       WHERE group_id = $2 AND user_id = $3`,
      [durationMinutes, id, userId]
    );
    // Update group total
    await db.query(
      `UPDATE groups SET total_xp = total_xp + $1, focus_sessions_count = focus_sessions_count + 1
       WHERE id = $2`,
      [durationMinutes, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Share a resource in the study group
export const shareResource = async (req, res) => {
  const { id } = req.params;
  const { title, description, url, fileUrl } = req.body;
  const userId = req.user.id;
  try {
    const result = await db.query(
      `INSERT INTO group_resources (group_id, user_id, title, description, url, file_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, userId, title, description, url, fileUrl]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Get study group resources
export const getGroupResources = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      `SELECT r.*, u.full_name as author_name
       FROM group_resources r
       JOIN users u ON r.user_id = u.id
       WHERE r.group_id = $1
       ORDER BY r.created_at DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};