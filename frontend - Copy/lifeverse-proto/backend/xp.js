import pool from '../config/db.js';

// XP needed to reach each level (cumulative)
export const XP_PER_LEVEL = 500;

export const calculateLevel = (totalXP) => {
  return Math.floor(totalXP / XP_PER_LEVEL) + 1;
};

export const xpToNextLevel = (totalXP) => {
  const currentLevelXP = totalXP % XP_PER_LEVEL;
  return { current: currentLevelXP, needed: XP_PER_LEVEL, percent: Math.round((currentLevelXP / XP_PER_LEVEL) * 100) };
};

export const awardXP = async (userId, amount, source, sourceId = null) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Add XP history entry
    await client.query(
      'INSERT INTO xp_history (user_id, xp_gained, source, source_id) VALUES ($1,$2,$3,$4)',
      [userId, amount, source, sourceId]
    );

    // Update user XP and level
    const result = await client.query(
      `UPDATE users SET xp = xp + $1, level = $2, updated_at = NOW()
       WHERE id = $3 RETURNING xp, level`,
      [amount, calculateLevel((await pool.query('SELECT xp FROM users WHERE id=$1', [userId])).rows[0].xp + amount), userId]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const checkAndAwardBadges = async (userId) => {
  const userRes = await pool.query(
    `SELECT u.xp, u.level, u.streak_days,
      (SELECT COUNT(*) FROM goals WHERE user_id=$1 AND status='completed') as goals_completed,
      (SELECT COUNT(*) FROM community_members WHERE user_id=$1) as communities_joined,
      (SELECT COUNT(*) FROM posts WHERE user_id=$1) as posts_made
     FROM users u WHERE u.id=$1`,
    [userId]
  );
  const stats = userRes.rows[0];
  const earned = [];

  const badges = await pool.query('SELECT * FROM badges');
  const userBadges = await pool.query('SELECT badge_id FROM user_badges WHERE user_id=$1', [userId]);
  const ownedIds = new Set(userBadges.rows.map(r => r.badge_id));

  for (const badge of badges.rows) {
    if (ownedIds.has(badge.id)) continue;
    let qualifies = false;

    switch (badge.requirement_type) {
      case 'goals_completed': qualifies = parseInt(stats.goals_completed) >= badge.requirement_value; break;
      case 'streak_days': qualifies = parseInt(stats.streak_days) >= badge.requirement_value; break;
      case 'communities_joined': qualifies = parseInt(stats.communities_joined) >= badge.requirement_value; break;
      case 'level_reached': qualifies = parseInt(stats.level) >= badge.requirement_value; break;
      case 'posts_made': qualifies = parseInt(stats.posts_made) >= badge.requirement_value; break;
    }

    if (qualifies) {
      await pool.query('INSERT INTO user_badges (user_id, badge_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [userId, badge.id]);
      await awardXP(userId, badge.xp_reward, 'badge', badge.id);
      earned.push(badge);
    }
  }

  return earned;
};