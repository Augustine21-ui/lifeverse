// backend/src/goalsController.js
import { query } from './db.js';

// Helper to generate a simple quiz based on milestone title
const generateQuiz = (title) => ({
  questions: [
    {
      question: `What is the primary objective of "${title}"?`,
      options: [
        `Master the key concepts of ${title}`,
        `Only complete a single exercise`,
        `Skip ${title} entirely`
      ],
      correct: 0
    },
    {
      question: `How will mastering "${title}" help you?`,
      options: [
        `It will improve your problem‑solving skills`,
        `It has no real benefit`,
        `It only helps with exams`
      ],
      correct: 0
    }
  ]
});

export const getGoals = async (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;
  try {
    const userRes = await query('SELECT course FROM users WHERE id = $1', [userId]);
    const userCourse = userRes.rows[0]?.course || null;
    let sql = 'SELECT * FROM goals WHERE user_id = $1';
    const params = [userId];
    if (status === 'active') {
      sql += " AND status != 'completed'";
    } else if (status === 'completed') {
      sql += " AND status = 'completed'";
    }
    if (userCourse) {
      sql += ' AND (course IS NULL OR course = $2)';
      params.push(userCourse);
    }
    sql += ' ORDER BY created_at DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// backend/src/controllers/goalsController.js

export const createGoal = async (req, res) => {
  const { title, description, target_date, progress } = req.body;
  const userId = req.user.id;
  try {
    const result = await db.query(
      `INSERT INTO goals (user_id, title, description, target_date, progress)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, title, description, target_date || null, progress || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getGoals = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query(`
      SELECT id, title, description, target_date, completed, progress, xp_reward, created_at, updated_at
      FROM goals
      WHERE user_id = $1
      ORDER BY target_date ASC NULLS LAST
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const updateGoal = async (req, res) => {
  const userId = req.user.id;
  const goalId = parseInt(req.params.id);
  const { title, description, category, due_date, status } = req.body;
  try {
    const result = await query(
      'UPDATE goals SET title = COALESCE($1, title), description = COALESCE($2, description), category = COALESCE($3, category), due_date = COALESCE($4, due_date), status = COALESCE($5, status) WHERE id = $6 AND user_id = $7 RETURNING *',
      [title, description, category, due_date, status, goalId, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Goal not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteGoal = async (req, res) => {
  const userId = req.user.id;
  const goalId = parseInt(req.params.id);
  try {
    const result = await query('DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id', [goalId, userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Goal not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const toggleMilestone = async (req, res) => {
  const userId = req.user.id;
  const goalId = parseInt(req.params.id);
  const milestoneId = parseInt(req.params.milestoneId);
  try {
    const goalResult = await query('SELECT milestones, target_value FROM goals WHERE id = $1 AND user_id = $2', [goalId, userId]);
    if (goalResult.rows.length === 0) return res.status(404).json({ error: 'Goal not found' });
    const goal = goalResult.rows[0];
    let milestones = goal.milestones || [];
    const milestoneIndex = milestones.findIndex(m => m.id === milestoneId);
    if (milestoneIndex === -1) return res.status(404).json({ error: 'Milestone not found' });
    milestones[milestoneIndex].is_completed = !milestones[milestoneIndex].is_completed;
    const completedCount = milestones.filter(m => m.is_completed).length;
    const totalMilestones = milestones.length;
    const progressPercent = totalMilestones > 0 ? (completedCount / totalMilestones) : 0;
    const current_value = Math.round(goal.target_value * progressPercent);
    await query('UPDATE goals SET milestones = $1, current_value = $2 WHERE id = $3', [JSON.stringify(milestones), current_value, goalId]);
    res.json({ success: true, current_value, progressPercent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};