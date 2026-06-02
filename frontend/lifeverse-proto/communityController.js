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