import { query } from './db.js';

export const getOpportunities = async (req, res) => {
  const userId = req.user.id;
  try {
    const userRes = await query('SELECT course, education_level FROM users WHERE id = $1', [userId]);
    const userCourse = userRes.rows[0]?.course || null;
    const userEduLevel = userRes.rows[0]?.education_level || null;
    
    let sql = 'SELECT * FROM opportunities';
    const params = [];
    let conditions = [];
    if (userCourse) {
      conditions.push('(course = $1)');
      params.push(userCourse);
    }
    if (userEduLevel) {
      conditions.push('(education_level = $2)');
      params.push(userEduLevel);
    }
    if (conditions.length) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY deadline ASC';
    const opportunities = await query(sql, params);
    res.json(opportunities.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const applyOpportunity = async (req, res) => {
  const userId = req.user.id;
  const { opportunityId } = req.body;
  if (!opportunityId) return res.status(400).json({ error: 'Opportunity ID required' });
  try {
    await query('INSERT INTO opportunity_applications (user_id, opportunity_id) VALUES ($1, $2)', [userId, opportunityId]);
    const opp = await query('SELECT xp_reward FROM opportunities WHERE id = $1', [opportunityId]);
    if (opp.rows[0]?.xp_reward) {
      await query('UPDATE users SET xp = xp + $1 WHERE id = $2', [opp.rows[0].xp_reward, userId]);
    }
    res.json({ success: true, message: 'Application recorded' });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Already applied' });
    res.status(500).json({ error: err.message });
  }
};

export const getUserApplications = async (req, res) => {
  const userId = req.user.id;
  try {
    const apps = await query(`
      SELECT o.*, oa.applied_at, oa.status 
      FROM opportunity_applications oa
      JOIN opportunities o ON oa.opportunity_id = o.id
      WHERE oa.user_id = $1
      ORDER BY oa.applied_at DESC
    `, [userId]);
    res.json(apps.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
