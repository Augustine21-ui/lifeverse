// backend/src/controllers/skillsController.js
import db from '../config/db.js';

export const getSkills = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM skills ORDER BY category, name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUserSkills = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query(`
      SELECT s.*, us.level, us.progress, us.evidence, us.updated_at
      FROM user_skills us
      JOIN skills s ON us.skill_id = s.id
      WHERE us.user_id = $1
      ORDER BY s.category, s.name
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateUserSkill = async (req, res) => {
  const { skillId, level, progress, evidence } = req.body;
  const userId = req.user.id;
  try {
    const result = await db.query(`
      INSERT INTO user_skills (user_id, skill_id, level, progress, evidence)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, skill_id) DO UPDATE
      SET level = EXCLUDED.level,
          progress = EXCLUDED.progress,
          evidence = EXCLUDED.evidence,
          updated_at = NOW()
      RETURNING *
    `, [userId, skillId, level, progress, evidence || []]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSkillsSummary = async (req, res) => {
  const userId = req.user.id;
  try {
    const xpRes = await db.query('SELECT xp, level FROM users WHERE id = $1', [userId]);
    const { xp, level } = xpRes.rows[0];
    const skillsRes = await db.query('SELECT COUNT(*) FROM user_skills WHERE user_id = $1', [userId]);
    const skillsCount = parseInt(skillsRes.rows[0].count) || 0;
    const badgesRes = await db.query('SELECT COUNT(*) FROM user_badges WHERE user_id = $1', [userId]);
    const achievementsCount = parseInt(badgesRes.rows[0].count) || 0;
    const goalsRes = await db.query('SELECT COUNT(*) FROM goals WHERE user_id = $1 AND status = $2', [userId, 'active']);
    const goalsCount = parseInt(goalsRes.rows[0].count) || 0;

    res.json({
      xp: xp || 0,
      level: level || 1,
      skillsCount,
      achievementsCount,
      goalsCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};