import pool from '../config/db.js'; // <-- Change this path

export async function getSkillsDashboard(req, res, next) {
  try {
    const userId = req.user.id;

    // 1. Get user's skills
    const skillsRes = await pool.query(
      `SELECT s.id, s.name, s.icon 
       FROM user_skills us 
       JOIN skills s ON us.skill_id = s.id 
       WHERE us.user_id = $1`,
      [userId]
    );

    // 2. Get all activities for these skills
    const actRes = await pool.query(
      `SELECT * FROM skill_activities WHERE skill_id = ANY($1::int[])`,
      [skillsRes.rows.map(s => s.id)]
    );

    // 3. Get user's submissions
    const subRes = await pool.query(
      `SELECT sub.id, a.title, a.context, a.activity_kind, s.name as skill_name, sub.response_text, sub.saved_at
       FROM skill_activity_submissions sub
       JOIN skill_activities a ON sub.activity_id = a.id
       JOIN skills s ON a.skill_id = s.id
       WHERE sub.user_id = $1
       ORDER BY sub.saved_at DESC`,
      [userId]
    );

    // Format activities into an object grouped by skill name
    const activities = {};
    actRes.rows.forEach(act => {
      const skill = skillsRes.rows.find(s => s.id === act.skill_id);
      if (!skill) return;
      
      if (!activities[skill.name]) {
        activities[skill.name] = { practice: {}, followup: null };
      }
      
      if (act.activity_kind === 'followup') {
        activities[skill.name].followup = act;
      } else {
        activities[skill.name].practice[act.context] = act;
      }
    });

    res.json({
      skills: skillsRes.rows,
      activities: activities,
      submissions: subRes.rows
    });
  } catch (err) {
    next(err);
  }
}

export async function submitEvidence(req, res, next) {
  try {
    const userId = req.user.id;
    const { activity_id, response_text } = req.body;

    if (!activity_id || !response_text) {
      return res.status(400).json({ error: 'Activity ID and response text are required' });
    }

    const insert = await pool.query(
      `INSERT INTO skill_activity_submissions (user_id, activity_id, response_text)
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, activity_id, response_text]
    );

    res.status(201).json({ submission: insert.rows[0] });
  } catch (err) {
    next(err);
  }
}