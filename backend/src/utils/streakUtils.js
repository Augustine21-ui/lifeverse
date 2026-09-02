// backend/src/utils/streakUtils.js
import pool from '../config/db.js';

export const updateUserStreak = async (userId) => {
  // Get current streak and last activity date
  const userRes = await pool.query(
    `SELECT streak_days, last_activity_date FROM users WHERE id = $1`,
    [userId]
  );
  if (userRes.rows.length === 0) return;

  const user = userRes.rows[0];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let lastActivity = user.last_activity_date ? new Date(user.last_activity_date) : null;
  if (lastActivity) lastActivity.setHours(0, 0, 0, 0);

  let newStreak = user.streak_days || 0;

  if (!lastActivity) {
    // First activity ever
    newStreak = 1;
  } else {
    const dayDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
    if (dayDiff === 0) {
      // Already active today – no change
    } else if (dayDiff === 1) {
      // Consecutive day → increment
      newStreak += 1;
    } else {
      // Gap > 1 day → reset
      newStreak = 1;
    }
  }

  // Update user
  await pool.query(
    `UPDATE users SET streak_days = $1, last_activity_date = NOW() WHERE id = $2`,
    [newStreak, userId]
  );
};