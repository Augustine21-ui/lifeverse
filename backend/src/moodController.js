import { query } from './db.js';
import { awardXP } from './dashboardController.js';

export const recordMood = async (req, res) => {
  const userId = req.user.id;
  const { mood } = req.body;
  const xpMap = { great: 50, okay: 30, struggling: 20 };
  const xp = xpMap[mood] || 0;

  try {
    const existing = await query(
      'SELECT id FROM mood_entries WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE',
      [userId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'You have already recorded your mood today.' });
    }
    await query('INSERT INTO mood_entries (user_id, mood, xp_awarded) VALUES ($1, $2, $3)', [userId, mood, xp]);
    await awardXP(userId, xp);
    res.json({ success: true, xpAwarded: xp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const hasMoodToday = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query(
      'SELECT id FROM mood_entries WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE',
      [userId]
    );
    res.json({ hasMood: result.rows.length > 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
