import db from './config/db.js';

export const recordMood = async (req, res) => {
  const userId = req.user.id;
  const { mood } = req.body;
  if (!mood) return res.status(400).json({ error: 'Mood is required' });
  try {
    await db.query('UPDATE users SET mood = $1 WHERE id = $2', [mood, userId]);
    res.json({ success: true, mood });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Optional: get mood
export const getMood = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query('SELECT mood FROM users WHERE id = $1', [userId]);
    res.json({ mood: result.rows[0]?.mood || 'neutral' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};