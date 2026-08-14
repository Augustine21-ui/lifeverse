// backend/src/controllers/leaderboardController.js
import db from '../config/db.js';

// Types and their display names
const LEADERBOARD_TYPES = {
  xp: { label: 'Top Learners', icon: '🏆' },
  streak: { label: 'Streak Masters', icon: '🔥' },
  likes: { label: 'Most Appreciated', icon: '❤️' },
  challenges: { label: 'Challenge Champions', icon: '🎯' },
  tasks: { label: 'Orbit Masters', icon: '🚀' },
  community: { label: 'Community Helpers', icon: '🤝' },
};

// Calculate scores for all users
const calculateScores = async () => {
  // 1. XP – straight from users table
  const xpQuery = `SELECT id, xp FROM users WHERE xp > 0`;
  // 2. Streak – streak_days
  const streakQuery = `SELECT id, streak_days FROM users WHERE streak_days > 0`;
  // 3. Likes received – count likes on user's posts
  const likesQuery = `
    SELECT p.user_id, COUNT(l.id) as likes_received
    FROM posts p
    JOIN likes l ON p.id = l.post_id
    GROUP BY p.user_id
  `;
  // 4. Challenges completed – count of approved user_challenges
  const challengesQuery = `
    SELECT user_id, COUNT(*) as challenges_completed
    FROM user_challenges
    WHERE status = 'approved'
    GROUP BY user_id
  `;
  // 5. Tasks completed – count of completed tasks
  const tasksQuery = `
    SELECT user_id, COUNT(*) as tasks_completed
    FROM tasks
    WHERE is_completed = true
    GROUP BY user_id
  `;
  // 6. Community engagement – sum of posts + comments + group_posts
  const communityQuery = `
    WITH all_interactions AS (
      SELECT user_id, COUNT(*) as cnt FROM posts GROUP BY user_id
      UNION ALL
      SELECT user_id, COUNT(*) as cnt FROM comments GROUP BY user_id
      UNION ALL
      SELECT user_id, COUNT(*) as cnt FROM group_posts GROUP BY user_id
    )
    SELECT user_id, SUM(cnt) as total_interactions
    FROM all_interactions
    GROUP BY user_id
  `;

  // Execute all queries in parallel
  const [xpRes, streakRes, likesRes, challengesRes, tasksRes, communityRes] = await Promise.all([
    db.query(xpQuery),
    db.query(streakQuery),
    db.query(likesQuery),
    db.query(challengesQuery),
    db.query(tasksQuery),
    db.query(communityQuery).catch(() => ({ rows: [] })),
  ]);

  // Map results to objects keyed by user_id
  const scores = {
    xp: xpRes.rows.reduce((acc, r) => ({ ...acc, [r.id]: r.xp }), {}),
    streak: streakRes.rows.reduce((acc, r) => ({ ...acc, [r.id]: r.streak_days }), {}),
    likes: likesRes.rows.reduce((acc, r) => ({ ...acc, [r.user_id]: parseInt(r.likes_received) }), {}),
    challenges: challengesRes.rows.reduce((acc, r) => ({ ...acc, [r.user_id]: parseInt(r.challenges_completed) }), {}),
    tasks: tasksRes.rows.reduce((acc, r) => ({ ...acc, [r.user_id]: parseInt(r.tasks_completed) }), {}),
    community: communityRes.rows.reduce((acc, r) => ({ ...acc, [r.user_id]: parseInt(r.total_interactions) }), {}),
  };

  return scores;
};

// Refresh leaderboard cache (store in DB)
export const refreshLeaderboards = async () => {
  try {
    const scores = await calculateScores();
    for (const type of Object.keys(LEADERBOARD_TYPES)) {
      const userScores = scores[type] || {};
      for (const [userId, score] of Object.entries(userScores)) {
        await db.query(
          `INSERT INTO leaderboard_entries (user_id, leaderboard_type, score, updated_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (user_id, leaderboard_type)
           DO UPDATE SET score = EXCLUDED.score, updated_at = NOW()`,
          [userId, type, score]
        );
      }
    }
  } catch (err) {
    console.error('Refresh leaderboard error:', err);
  }
};

// ✅ SINGLE DEFINITION - Get leaderboard
export const getLeaderboard = async (req, res) => {
  const { type = 'xp' } = req.query;
  const limit = parseInt(req.query.limit) || 50;

  // Check if leaderboard type is valid
  if (!LEADERBOARD_TYPES[type]) {
    return res.status(400).json({ error: 'Invalid leaderboard type' });
  }

  try {
    // Check if we need to refresh (entries older than 1 hour)
    const check = await db.query(
      `SELECT updated_at FROM leaderboard_entries WHERE leaderboard_type = $1 ORDER BY updated_at DESC LIMIT 1`,
      [type]
    );
    let needRefresh = true;
    if (check.rows.length > 0) {
      const lastUpdate = new Date(check.rows[0].updated_at);
      const now = new Date();
      const diff = (now - lastUpdate) / (1000 * 60); // minutes
      if (diff < 60) needRefresh = false;
    }

    if (needRefresh) {
      await refreshLeaderboards();
    }

    // Fetch the leaderboard with rank
    const ranked = await db.query(
      `SELECT ROW_NUMBER() OVER (ORDER BY le.score DESC) as rank,
              u.id, u.full_name, u.username, u.avatar_url, le.score
       FROM leaderboard_entries le
       JOIN users u ON le.user_id = u.id
       WHERE le.leaderboard_type = $1
       ORDER BY le.score DESC
       LIMIT $2`,
      [type, limit]
    );

    // Fetch current user's rank if logged in
    let userRank = null;
    if (req.user && req.user.id) {
      const rankQuery = await db.query(
        `SELECT rank FROM (
          SELECT user_id, ROW_NUMBER() OVER (ORDER BY score DESC) as rank
          FROM leaderboard_entries
          WHERE leaderboard_type = $1
        ) ranked WHERE user_id = $2`,
        [type, req.user.id]
      );
      if (rankQuery.rows.length > 0) {
        userRank = rankQuery.rows[0].rank;
      }
    }

    res.json({
      type,
      label: LEADERBOARD_TYPES[type].label,
      icon: LEADERBOARD_TYPES[type].icon,
      entries: ranked.rows,
      userRank,
      mock: false
    });
  } catch (err) {
    console.error('Leaderboard error:', err);
    // Fallback to mock data on error
    res.json({
      type,
      label: LEADERBOARD_TYPES[type]?.label || 'Leaderboard',
      icon: LEADERBOARD_TYPES[type]?.icon || '🏆',
      entries: [
        { rank: 1, id: 1, full_name: 'User 1', username: 'user1', score: 1000 },
        { rank: 2, id: 2, full_name: 'User 2', username: 'user2', score: 900 },
        { rank: 3, id: 3, full_name: 'User 3', username: 'user3', score: 800 }
      ],
      userRank: null,
      mock: true,
      message: 'Using mock data - database may not have leaderboard entries yet'
    });
  }
};

export default {
  getLeaderboard,
  refreshLeaderboards,
};