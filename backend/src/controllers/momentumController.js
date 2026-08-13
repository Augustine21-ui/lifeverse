import db from '../config/db.js';

// ===== GET COMMUNITIES =====
export const getCommunities = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, search } = req.query;
    
    let query = `
      SELECT c.*, 
        (SELECT COUNT(*) FROM community_members WHERE community_id = c.id) as member_count,
        (SELECT COUNT(*) FROM posts WHERE community_id = c.id) as post_count,
        EXISTS (SELECT 1 FROM community_members WHERE community_id = c.id AND user_id = $1) as is_member
      FROM communities c
      WHERE 1=1
    `;
    const params = [userId];
    let paramIndex = 2;
    
    if (type) {
      query += ` AND c.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    if (search) {
      query += ` AND c.name ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    query += ` ORDER BY c.member_count DESC, c.created_at DESC LIMIT 20`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('getCommunities error:', err);
    res.status(500).json({ error: 'Failed to fetch communities' });
  }
};

// ===== GET COMMUNITY BY ID =====
export const getCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await db.query(
      `SELECT c.*,
        (SELECT COUNT(*) FROM community_members WHERE community_id = c.id) as member_count,
        (SELECT COUNT(*) FROM posts WHERE community_id = c.id) as post_count,
        EXISTS (SELECT 1 FROM community_members WHERE community_id = c.id AND user_id = $1) as is_member
       FROM communities c
       WHERE c.id = $2`,
      [userId, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Community not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('getCommunity error:', err);
    res.status(500).json({ error: 'Failed to fetch community' });
  }
};

// ===== CREATE COMMUNITY =====
export const createCommunity = async (req, res) => {
  try {
    const { name, description, type, category, is_private } = req.body;
    const userId = req.user.id;
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const result = await db.query(
      `INSERT INTO communities (name, description, type, category, is_private, join_code, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, description, type, category, is_private, joinCode, userId]
    );
    
    await db.query(
      `INSERT INTO community_members (community_id, user_id, role) VALUES ($1, $2, 'admin')`,
      [result.rows[0].id, userId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createCommunity error:', err);
    res.status(500).json({ error: 'Failed to create community' });
  }
};

// ===== JOIN COMMUNITY =====
export const joinCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const memberCheck = await db.query(
      'SELECT id FROM community_members WHERE community_id = $1 AND user_id = $2',
      [id, userId]
    );
    if (memberCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Already a member' });
    }
    
    await db.query(
      `INSERT INTO community_members (community_id, user_id) VALUES ($1, $2)`,
      [id, userId]
    );
    
    await db.query(
      `UPDATE communities SET member_count = member_count + 1 WHERE id = $1`,
      [id]
    );
    
    res.json({ success: true, message: 'Joined community' });
  } catch (err) {
    console.error('joinCommunity error:', err);
    res.status(500).json({ error: 'Failed to join community' });
  }
};

// ===== LEAVE COMMUNITY =====
export const leaveCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    await db.query(
      `DELETE FROM community_members WHERE community_id = $1 AND user_id = $2`,
      [id, userId]
    );
    
    await db.query(
      `UPDATE communities SET member_count = member_count - 1 WHERE id = $1`,
      [id]
    );
    
    res.json({ success: true, message: 'Left community' });
  } catch (err) {
    console.error('leaveCommunity error:', err);
    res.status(500).json({ error: 'Failed to leave community' });
  }
};

// ===== GET COMMUNITY POSTS =====
export const getCommunityPosts = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    const userId = req.user.id;
    
    const result = await db.query(
      `SELECT p.*, u.full_name, u.username,
        EXISTS (SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) as user_liked
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.community_id = $2
       ORDER BY p.is_pinned DESC, p.created_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, id, limit, offset]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('getCommunityPosts error:', err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

// ===== CREATE POST =====
export const createPost = async (req, res) => {
  try {
    const { community_id, content, post_type, is_announcement } = req.body;
    const userId = req.user.id;
    
    const result = await db.query(
      `INSERT INTO posts (community_id, user_id, content, post_type, is_announcement)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [community_id, userId, content, post_type || 'text', is_announcement || false]
    );
    
    await db.query(
      `UPDATE communities SET post_count = post_count + 1 WHERE id = $1`,
      [community_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createPost error:', err);
    res.status(500).json({ error: 'Failed to create post' });
  }
};

// ===== TOGGLE LIKE =====
export const toggleLike = async (req, res) => {
  try {
    const { post_id } = req.params;
    const userId = req.user.id;
    
    const existing = await db.query(
      'SELECT id FROM likes WHERE user_id = $1 AND post_id = $2',
      [userId, post_id]
    );
    
    if (existing.rows.length > 0) {
      await db.query(
        'DELETE FROM likes WHERE user_id = $1 AND post_id = $2',
        [userId, post_id]
      );
      await db.query(
        'UPDATE posts SET likes_count = likes_count - 1 WHERE id = $1',
        [post_id]
      );
      res.json({ liked: false });
    } else {
      await db.query(
        'INSERT INTO likes (user_id, post_id) VALUES ($1, $2)',
        [userId, post_id]
      );
      await db.query(
        'UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1',
        [post_id]
      );
      res.json({ liked: true });
    }
  } catch (err) {
    console.error('toggleLike error:', err);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
};

// ===== GET COMMENTS =====
export const getComments = async (req, res) => {
  try {
    const { post_id } = req.params;
    const result = await db.query(
      `SELECT c.*, u.full_name, u.username
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [post_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getComments error:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

// ===== ADD COMMENT =====
export const addComment = async (req, res) => {
  try {
    const { post_id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    
    const result = await db.query(
      `INSERT INTO comments (post_id, user_id, content)
       VALUES ($1, $2, $3) RETURNING *`,
      [post_id, userId, content]
    );
    
    await db.query(
      'UPDATE posts SET comments_count = comments_count + 1 WHERE id = $1',
      [post_id]
    );
    
    const userRes = await db.query(
      'SELECT full_name, username FROM users WHERE id = $1',
      [userId]
    );
    
    res.status(201).json({
      ...result.rows[0],
      user: userRes.rows[0]
    });
  } catch (err) {
    console.error('addComment error:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

// ===== GET EVENTS =====
export const getCommunityEvents = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const result = await db.query(
      `SELECT e.*, u.full_name as creator_name,
        EXISTS (SELECT 1 FROM event_rsvps WHERE event_id = e.id AND user_id = $1) as user_rsvped
       FROM community_events e
       JOIN users u ON e.created_by = u.id
       WHERE e.community_id = $2
       ORDER BY e.start_time ASC`,
      [userId, id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getCommunityEvents error:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

// ===== RSVP EVENT =====
export const rsvpEvent = async (req, res) => {
  try {
    const { event_id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    
    await db.query(
      `INSERT INTO event_rsvps (event_id, user_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id, user_id) 
       DO UPDATE SET status = $3`,
      [event_id, userId, status]
    );
    
    res.json({ success: true, message: 'RSVP updated' });
  } catch (err) {
    console.error('rsvpEvent error:', err);
    res.status(500).json({ error: 'Failed to RSVP' });
  }
};