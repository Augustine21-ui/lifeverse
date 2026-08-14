import db from '../config/db.js';

export const getCurrentStudy = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      'SELECT current_subject, current_topic FROM users WHERE id = $1',
      [userId]
    );
    const { current_subject, current_topic } = result.rows[0] || {};
    res.json({ subject: current_subject || '', topic: current_topic || '' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch study context' });
  }
};

export const updateCurrentStudy = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject, topic } = req.body;
    await db.query(
      'UPDATE users SET current_subject = $1, current_topic = $2 WHERE id = $3',
      [subject || null, topic || null, userId]
    );
    res.json({ success: true, subject, topic });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update study context' });
  }
};

export const getCurrentStudy = async (req, res) => {
  try {
    res.json({
      currentStudy: "Study topic",
      progress: 45,
      mock: true
    });
  } catch (error) {
    console.error("Get study error:", error);
    res.status(500).json({ error: "Failed to get current study" });
  }
};

export const updateCurrentStudy = async (req, res) => {
  try {
    const { topic, progress } = req.body;
    res.json({
      success: true,
      updated: { topic, progress },
      mock: true
    });
  } catch (error) {
    console.error("Update study error:", error);
    res.status(500).json({ error: "Failed to update current study" });
  }
};