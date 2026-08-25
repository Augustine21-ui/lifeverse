// backend/src/controllers/goalsController.js
import { query } from '../db.js';

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

// Get all goals for the user
export const getGoals = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query(`
      SELECT id, title, description, target_date, completed, progress, xp_reward, milestones, created_at, updated_at
      FROM goals
      WHERE user_id = $1
      ORDER BY target_date ASC NULLS LAST
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Create a new goal
export const createGoal = async (req, res) => {
  const userId = req.user.id;
  const { title, description, target_date, xp_reward = 100, milestones = [] } = req.body;
  try {
    const result = await query(
      `INSERT INTO goals (user_id, title, description, target_date, xp_reward, milestones, progress, completed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, title, description || '', target_date, xp_reward, JSON.stringify(milestones), 0, false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Update a goal
export const updateGoal = async (req, res) => {
  const userId = req.user.id;
  const goalId = parseInt(req.params.id);
  const { title, description, target_date, progress, completed, xp_reward, milestones } = req.body;

  try {
    const result = await query(
      `UPDATE goals
       SET 
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         target_date = COALESCE($3, target_date),
         progress = COALESCE($4, progress),
         completed = COALESCE($5, completed),
         xp_reward = COALESCE($6, xp_reward),
         milestones = COALESCE($7, milestones),
         updated_at = NOW()
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [title, description, target_date, progress, completed, xp_reward,
       milestones ? JSON.stringify(milestones) : null, goalId, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Delete a goal
export const deleteGoal = async (req, res) => {
  const userId = req.user.id;
  const goalId = parseInt(req.params.id);
  try {
    const result = await query('DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id', [goalId, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Toggle a milestone within a goal
export const toggleMilestone = async (req, res) => {
  const userId = req.user.id;
  const goalId = parseInt(req.params.id);
  const milestoneId = parseInt(req.params.milestoneId);
  try {
    const goalResult = await query('SELECT milestones, target_value FROM goals WHERE id = $1 AND user_id = $2', [goalId, userId]);
    if (goalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    const goal = goalResult.rows[0];
    let milestones = goal.milestones || [];
    const milestoneIndex = milestones.findIndex(m => m.id === milestoneId);
    if (milestoneIndex === -1) {
      return res.status(404).json({ error: 'Milestone not found' });
    }
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