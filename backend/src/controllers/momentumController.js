import db from '../db.js';

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
  const { communityId } = req.params;
  try {
    const result = await db.query(`
      SELECT 
        e.id, 
        e.title, 
        e.description, 
        e.event_date AS start_time,
        e.location, 
        e.created_by, 
        e.created_at,
        u.full_name AS organizer,
        (SELECT COUNT(*) FROM event_rsvps WHERE event_id = e.id) AS attending_count
      FROM community_events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.community_id = $1
      ORDER BY e.event_date ASC
    `, [communityId]);
    res.json(result.rows);
  } catch (err) {
    console.error('getCommunityEvents error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ===== RSVP EVENT =====
export const rsvpEvent = async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.id;
  console.log('🔍 RSVP request - eventId:', eventId, 'type:', typeof eventId, 'userId:', userId);

  try {
    // 1. Check if event exists
    const eventCheck = await db.query(
      'SELECT id FROM community_events WHERE id = $1',
      [eventId]
    );
    console.log('📦 Event check result:', eventCheck.rows);

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // 2. Check if user already RSVP'd
    const existing = await db.query(
      'SELECT id FROM event_rsvps WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already RSVP\'d' });
    }

    // 3. Insert RSVP
    const result = await db.query(
      'INSERT INTO event_rsvps (event_id, user_id) VALUES ($1, $2) RETURNING *',
      [eventId, userId]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('rsvpEvent error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ===== GET NOTIFICATIONS =====
export const getNotifications = async (req, res) => {
  const userId = req.user.id;
  try {
    // 1. Recent likes on posts (including user's own posts)
    const likes = await db.query(`
      SELECT 
        l.created_at,
        u.full_name AS actor_name,
        'like' AS type,
        p.id AS post_id,
        p.content AS post_content
      FROM likes l
      JOIN users u ON l.user_id = u.id
      JOIN posts p ON l.post_id = p.id
      WHERE p.user_id = $1 OR p.id IN (
        SELECT post_id FROM community_posts cp 
        JOIN community_members cm ON cp.community_id = cm.community_id 
        WHERE cm.user_id = $1
      )
      ORDER BY l.created_at DESC
      LIMIT 20
    `, [userId]);

    // 2. Recent comments on posts
    const comments = await db.query(`
      SELECT 
        c.created_at,
        u.full_name AS actor_name,
        'comment' AS type,
        c.post_id,
        p.content AS post_content,
        c.content AS comment_content
      FROM comments c
      JOIN users u ON c.user_id = u.id
      JOIN posts p ON c.post_id = p.id
      WHERE p.user_id = $1 OR p.id IN (
        SELECT post_id FROM community_posts cp 
        JOIN community_members cm ON cp.community_id = cm.community_id 
        WHERE cm.user_id = $1
      )
      ORDER BY c.created_at DESC
      LIMIT 20
    `, [userId]);

    // 3. New members joining communities the user is admin of (or a member of)
    const newMembers = await db.query(`
      SELECT 
        cm.joined_at,
        u.full_name AS actor_name,
        'member' AS type,
        c.name AS community_name,
        cm.community_id
      FROM community_members cm
      JOIN users u ON cm.user_id = u.id
      JOIN communities c ON cm.community_id = c.id
      WHERE c.created_by = $1 OR cm.community_id IN (
        SELECT community_id FROM community_members WHERE user_id = $1
      )
      ORDER BY cm.joined_at DESC
      LIMIT 20
    `, [userId]);

    // 4. Upcoming events in communities the user is a member of (or created by them)
    const events = await db.query(`
      SELECT 
        e.created_at,
        'event' AS type,
        e.title,
        e.event_date,
        c.name AS community_name
      FROM community_events e
      JOIN communities c ON e.community_id = c.id
      WHERE e.community_id IN (
        SELECT community_id FROM community_members WHERE user_id = $1
      ) OR e.created_by = $1
      ORDER BY e.event_date ASC
      LIMIT 5
    `, [userId]);

    // Combine and sort by date
    const allNotifications = [
      ...likes.rows.map(r => ({
        id: `like_${r.post_id}_${r.created_at}`,
        type: 'like',
        message: `${r.actor_name} liked your post: "${r.post_content?.substring(0, 30)}${r.post_content?.length > 30 ? '...' : ''}"`,
        time: r.created_at,
        read: false, // we don't track read state
        link: `/momentum/post/${r.post_id}`
      })),
      ...comments.rows.map(r => ({
        id: `comment_${r.post_id}_${r.created_at}`,
        type: 'comment',
        message: `${r.actor_name} commented on your post: "${r.comment_content?.substring(0, 30)}${r.comment_content?.length > 30 ? '...' : ''}"`,
        time: r.created_at,
        read: false,
        link: `/momentum/post/${r.post_id}`
      })),
      ...newMembers.rows.map(r => ({
        id: `member_${r.community_id}_${r.joined_at}`,
        type: 'member',
        message: `${r.actor_name} joined your community: ${r.community_name}`,
        time: r.joined_at,
        read: false,
        link: `/momentum/community/${r.community_id}`
      })),
      ...events.rows.map(r => ({
        id: `event_${r.title}_${r.created_at}`,
        type: 'event',
        message: `Upcoming event: ${r.title} in ${r.community_name} on ${new Date(r.event_date).toLocaleDateString()}`,
        time: r.created_at,
        read: false,
        link: `/momentum/community/${r.community_id}`
      }))
    ];

    // Sort by time descending
    allNotifications.sort((a, b) => new Date(b.time) - new Date(a.time));

    // Take the most recent 30
    const recentNotifications = allNotifications.slice(0, 30);

    res.json(recentNotifications);
  } catch (err) {
    console.error('getNotifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};