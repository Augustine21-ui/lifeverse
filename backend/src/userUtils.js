import { query } from './db.js';

// XP needed for level L (L >= 1) = 500 * (L-1)
export const getLevelFromXP = (xp) => {
  return Math.floor(xp / 500) + 1;
};

export const updateUserLevel = async (userId) => {
  const res = await query('SELECT xp FROM users WHERE id = $1', [userId]);
  if (res.rows.length === 0) return;
  const xp = res.rows[0].xp;
  const newLevel = getLevelFromXP(xp);
  await query('UPDATE users SET level = $1 WHERE id = $2', [newLevel, userId]);
  return newLevel;
};
