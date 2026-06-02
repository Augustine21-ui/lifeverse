import { query } from './db.js';
import { awardXP } from './dashboardController.js';

const XP_FOR_POST = 10;
const XP_FOR_LIKE_RECEIVED = 5;
const XP_FOR_COMMENT_RECEIVED = 5;

export const createPost = async (req, res) => {
  const userId = req.user.id;
  const { content, imageUrl } = req.body;
  if (!content || content.trim() === "") {
    return res.status(400).json({ error: "Content is required" });
  }
  try {
    const result = await query(
      "INSERT INTO posts (user_id, content, image_url) VALUES ($1, $2, $3) RETURNING *",
      [userId, content, imageUrl || null]
    );
    const post = result.rows[0];
    await awardXP(userId, XP_FOR_POST);
    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const getPosts = async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  const userId = req.user.id;
  try {
    const posts = await query(
      `SELECT p.*, u.full_name, u.username, u.xp as user_xp, u.level as user_level,
        EXISTS (SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $3) as user_liked
       FROM posts p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset, userId]
    );
    res.json(posts.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const likePost = async (req, res) => {
  const userId = req.user.id;
  const postId = parseInt(req.params.id);
  try {
    const existing = await query("SELECT id FROM likes WHERE post_id = $1 AND user_id = $2", [postId, userId]);
    if (existing.rows.length > 0) {
      await query("DELETE FROM likes WHERE post_id = $1 AND user_id = $2", [postId, userId]);
      await query("UPDATE posts SET likes_count = likes_count - 1 WHERE id = $1", [postId]);
      res.json({ liked: false });
    } else {
      await query("INSERT INTO likes (post_id, user_id) VALUES ($1, $2)", [postId, userId]);
      await query("UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1", [postId]);
      const postOwner = await query("SELECT user_id FROM posts WHERE id = $1", [postId]);
      if (postOwner.rows[0].user_id !== userId) {
        await awardXP(postOwner.rows[0].user_id, XP_FOR_LIKE_RECEIVED);
      }
      res.json({ liked: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const getComments = async (req, res) => {
  const postId = parseInt(req.params.id);
  try {
    const comments = await query(
      `SELECT c.*, u.full_name, u.username
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [postId]
    );
    res.json(comments.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const addComment = async (req, res) => {
  const userId = req.user.id;
  const postId = parseInt(req.params.id);
  const { content } = req.body;
  if (!content || content.trim() === "") {
    return res.status(400).json({ error: "Comment cannot be empty" });
  }
  try {
    const result = await query(
      "INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING *",
      [postId, userId, content]
    );
    await query("UPDATE posts SET comments_count = comments_count + 1 WHERE id = $1", [postId]);
    const postOwner = await query("SELECT user_id FROM posts WHERE id = $1", [postId]);
    if (postOwner.rows[0].user_id !== userId) {
      await awardXP(postOwner.rows[0].user_id, XP_FOR_COMMENT_RECEIVED);
    }
    const userInfo = await query("SELECT full_name, username FROM users WHERE id = $1", [userId]);
    const newComment = { ...result.rows[0], full_name: userInfo.rows[0].full_name, username: userInfo.rows[0].username };
    res.status(201).json(newComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const deletePost = async (req, res) => {
  const userId = req.user.id;
  const postId = parseInt(req.params.id);
  try {
    const post = await query("SELECT user_id FROM posts WHERE id = $1", [postId]);
    if (post.rows.length === 0) return res.status(404).json({ error: "Post not found" });
    if (post.rows[0].user_id !== userId) return res.status(403).json({ error: "Not authorized" });
    await query("DELETE FROM comments WHERE post_id = $1", [postId]);
    await query("DELETE FROM likes WHERE post_id = $1", [postId]);
    await query("DELETE FROM posts WHERE id = $1", [postId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
