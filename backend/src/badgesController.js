import { query } from './db.js';

// Define badge definitions
const badges = [
  { id: 1, name: 'First Post', description: 'Made your first post in Momentum Feed', icon: '📝', xp_reward: 10, condition: 'first_post' },
  { id: 2, name: '7-Day Streak', description: 'Maintained a 7-day learning streak', icon: '🔥', xp_reward: 50, condition: 'streak_7' },
  { id: 3, name: 'Challenge Master', description: 'Completed 5 challenges', icon: '🏆', xp_reward: 100, condition: 'challenge_master' },
];

// Helper to award badge
const awardBadge = async (userId, badgeId) => {
  // Check if already awarded
  const existing = await query('SELECT id FROM user_badges WHERE user_id = $1 AND badge_id = $2', [userId, badgeId]);
  if (existing.rows.length > 0) return;

  // Award badge and XP
  const badge = badges.find(b => b.id === badgeId);
  if (badge) {
    await query('INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2)', [userId, badgeId]);
    await query('UPDATE users SET xp = xp + $1 WHERE id = $2', [badge.xp_reward, userId]);
    console.log(`Badge awarded: ${badge.name} to user ${userId}`);
  }
};

// Check and award all badges for a user
export const checkAndAwardBadges = async (userId) => {
  try {
    // 1. First Post badge – check if user has any posts in feed
    const postCount = await query('SELECT COUNT(*) FROM posts WHERE user_id = $1', [userId]);
    if (parseInt(postCount.rows[0].count) >= 1) {
      await awardBadge(userId, 1);
    }

    // 2. 7-Day Streak badge – check if user has streak >= 7
    // We need streak calculation (use same logic as dashboard)
    const activityDates = await query(`
      SELECT DISTINCT DATE(created_at) as activity_date FROM mood_entries WHERE user_id = $1
      UNION
      SELECT DISTINCT DATE(updated_at) as activity_date FROM tasks WHERE user_id = $1 AND is_completed = true
      UNION
      SELECT DISTINCT DATE(completed_at) as activity_date FROM focus_sessions WHERE user_id = $1
      ORDER BY activity_date DESC
    `, [userId]);
    const dates = activityDates.rows.map(row => new Date(row.activity_date).toISOString().split('T')[0]);
    let streak = 0;
    if (dates.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      if (dates[0] === today || dates[0] === new Date(Date.now() - 86400000).toISOString().split('T')[0]) {
        let currentStreak = 1;
        for (let i = 1; i < dates.length; i++) {
          const prevDate = new Date(dates[i-1]);
          const currDate = new Date(dates[i]);
          const diffDays = (prevDate - currDate) / (1000 * 3600 * 24);
          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
        streak = currentStreak;
      }
    }
    if (streak >= 7) {
      await awardBadge(userId, 2);
    }

    // 3. Challenge Master badge – check completed challenges count
    const challengeCount = await query(
      'SELECT COUNT(*) FROM user_challenges WHERE user_id = $1 AND status = $2',
      [userId, 'approved']
    );
    if (parseInt(challengeCount.rows[0].count) >= 5) {
      await awardBadge(userId, 3);
    }
  } catch (err) {
    console.error('Error checking badges:', err);
  }
};

// API: get all badges (with earned status)
export const getBadges = async (req, res) => {
  const userId = req.user.id;
  try {
    // Get user's earned badge IDs
    const earnedRes = await query('SELECT badge_id FROM user_badges WHERE user_id = $1', [userId]);
    const earnedIds = earnedRes.rows.map(r => r.badge_id);
    const badgesWithStatus = badges.map(b => ({
      ...b,
      earned: earnedIds.includes(b.id),
      earned_at: earnedIds.includes(b.id) ? (earnedRes.rows.find(r => r.badge_id === b.id)?.earned_at || null) : null,
    }));
    res.json(badgesWithStatus);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// API: get user's earned badges
export const getUserBadges = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query(`
      SELECT b.id, b.name, b.description, b.icon, b.xp_reward, ub.earned_at
      FROM badges b
      JOIN user_badges ub ON b.id = ub.badge_id
      WHERE ub.user_id = $1
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};