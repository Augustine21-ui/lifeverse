// backend/src/challengeController.js
import { query } from './db.js';
import { awardXP } from './dashboardController.js';

export const getChallenges = async (req, res) => {
  const userId = req.user.id;
  try {
    const userRes = await query('SELECT course, education_level FROM users WHERE id = $1', [userId]);
    const userCourse = userRes.rows[0]?.course || null;
    const userEduLevel = userRes.rows[0]?.education_level || null;
    
    let sql = 'SELECT * FROM challenges WHERE (course IS NULL OR course = $1) AND (education_level IS NULL OR education_level = $2)';
    const params = [userCourse, userEduLevel];
    sql += ' ORDER BY created_at DESC';
    const challenges = await query(sql, params);
    res.json(challenges.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const submitChallenge = async (req, res) => {
  const userId = req.user.id;
  const { challengeId, submission } = req.body;
  if (!challengeId || !submission) {
    return res.status(400).json({ error: 'Challenge ID and submission are required' });
  }
  try {
    const existing = await query('SELECT id FROM user_challenges WHERE user_id = $1 AND challenge_id = $2', [userId, challengeId]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already submitted' });
    }
    const challenge = await query('SELECT xp_reward FROM challenges WHERE id = $1', [challengeId]);
    if (challenge.rows.length === 0) return res.status(404).json({ error: 'Challenge not found' });
    const xpReward = challenge.rows[0].xp_reward;
    // Auto‑approve and award XP
    await query('INSERT INTO user_challenges (user_id, challenge_id, submission, status, xp_awarded, submitted_at) VALUES ($1, $2, $3, $4, $5, NOW())', [userId, challengeId, submission, 'completed', xpReward]);
    await awardXP(userId, xpReward);
    res.json({ success: true, message: 'Challenge completed!', xpAwarded: xpReward });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const getUserChallenges = async (req, res) => {
  const userId = req.user.id;
  try {
    const userChallenges = await query(
      'SELECT uc.*, c.title, c.description, c.xp_reward, c.category, c.difficulty FROM user_challenges uc JOIN challenges c ON uc.challenge_id = c.id WHERE uc.user_id = $1 ORDER BY uc.submitted_at DESC',
      [userId]
    );
    res.json(userChallenges.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};