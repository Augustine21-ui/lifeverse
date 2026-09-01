// backend/src/controllers/goalsController.js
import { query } from '../db.js';
import { generateCortexQuiz } from '../services/aiService.js';

// Helper to generate a simple quiz (fallback if AI not available)
const generateQuizFallback = (title) => ({
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

// ──────────────────────────────────────────────
// GET ALL GOALS
// ──────────────────────────────────────────────
export const getGoals = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query(`
      SELECT id, title, description, category, target_date, 
             completed, progress, xp_reward, xp_awarded, 
             milestones, metadata, created_at, updated_at, completed_at
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

// ──────────────────────────────────────────────
// CREATE GOAL – with category and actions
// ──────────────────────────────────────────────
export const createGoal = async (req, res) => {
  const userId = req.user.id;
  const { 
    title, description, category = 'academic', 
    target_date, xp_reward = 100, 
    milestones = [], metadata = {} 
  } = req.body;

  try {
    // 1. Insert goal
    const result = await query(
      `INSERT INTO goals 
       (user_id, title, description, category, target_date, xp_reward, milestones, progress, completed, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [userId, title, description || '', category, target_date || null, xp_reward, 
       JSON.stringify(milestones), 0, false, JSON.stringify(metadata)]
    );
    const goal = result.rows[0];

    // 2. Generate actions based on category
    const actions = [];

    if (category === 'academic') {
      let quiz;
      try {
        const quizData = await generateCortexQuiz({
          subject: 'General',
          topic: title,
          grade: 1,
          count: 5
        });
        quiz = { questions: quizData };
      } catch (e) {
        quiz = generateQuizFallback(title);
      }
      await query(
        `INSERT INTO goal_actions (goal_id, action_type, data)
         VALUES ($1, 'quiz', $2)`,
        [goal.id, JSON.stringify(quiz)]
      );
      actions.push('quiz');

      await query(
        `INSERT INTO goal_actions (goal_id, action_type, data)
         VALUES ($1, 'orbit_resources', $2)`,
        [goal.id, JSON.stringify({ subject: title, topic: description })]
      );
      actions.push('orbit_resources');

    } else if (category === 'skill') {
      // 🔧 Fix: safely handle skill creation without ON CONFLICT
      const skillName = metadata.skill_name || title;
      
      // Check if skill already exists
      let skillResult = await query('SELECT id FROM skills WHERE name = $1', [skillName]);
      let skillId;
      if (skillResult.rows.length > 0) {
        skillId = skillResult.rows[0].id;
      } else {
        const insertResult = await query(
          `INSERT INTO skills (name, category, description) 
           VALUES ($1, 'custom', $2)
           RETURNING id`,
          [skillName, description || '']
        );
        skillId = insertResult.rows[0].id;
      }

      // Link goal to skill
      await query(
        `UPDATE goals SET metadata = jsonb_set(metadata, '{skill_id}', $1::jsonb)
         WHERE id = $2`,
        [JSON.stringify(skillId), goal.id]
      );

      // Add skill growth action
      await query(
        `INSERT INTO goal_actions (goal_id, action_type, data)
         VALUES ($1, 'skill_growth', $2)`,
        [goal.id, JSON.stringify({ skill_id: skillId })]
      );
      actions.push('skill_growth');

    } else if (category === 'personal') {
      // Track study sessions
      const sessionsTarget = metadata.sessions_target || 30;
      await query(
        `INSERT INTO goal_actions (goal_id, action_type, data)
         VALUES ($1, 'track_sessions', $2)`,
        [goal.id, JSON.stringify({ target: sessionsTarget, completed: 0 })]
      );
      actions.push('track_sessions');

      // Create notification
      await query(
        `INSERT INTO notifications (user_id, type, title, message, data, is_priority)
         VALUES ($1, 'goal_tracking', $2, $3, $4, true)`,
        [userId, '🎯 Personal Goal Started!', 
         `Complete ${sessionsTarget} study sessions in Orbit to earn XP!`,
         JSON.stringify({ goal_id: goal.id, target: sessionsTarget })]
      );
      actions.push('notification');

    } else if (category === 'career') {
      // Fetch relevant opportunities
      const opportunities = await query(
        `SELECT id, title FROM opportunities 
         WHERE title ILIKE $1 OR description ILIKE $1
         LIMIT 5`,
        [`%${title}%`]
      );
      await query(
        `INSERT INTO goal_actions (goal_id, action_type, data)
         VALUES ($1, 'opportunities', $2)`,
        [goal.id, JSON.stringify(opportunities.rows)]
      );
      actions.push('opportunities');

      // Fetch relevant challenges
      const challenges = await query(
        `SELECT id, title FROM challenges 
         WHERE title ILIKE $1 OR description ILIKE $1
         LIMIT 5`,
        [`%${title}%`]
      );
      await query(
        `INSERT INTO goal_actions (goal_id, action_type, data)
         VALUES ($1, 'challenges', $2)`,
        [goal.id, JSON.stringify(challenges.rows)]
      );
      actions.push('challenges');
    }

    res.status(201).json({ ...goal, actions });
  } catch (err) {
    console.error('Create goal error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ──────────────────────────────────────────────
// GET GOAL ACTIONS
// ──────────────────────────────────────────────
export const getGoalActions = async (req, res) => {
  const goalId = req.params.id;
  try {
    const result = await query(
      `SELECT * FROM goal_actions WHERE goal_id = $1 ORDER BY created_at`,
      [goalId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ──────────────────────────────────────────────
// COMPLETE GOAL – award XP
// ──────────────────────────────────────────────
export const completeGoal = async (req, res) => {
  const userId = req.user.id;
  const goalId = req.params.id;
  try {
    const goal = await query(
      `SELECT * FROM goals WHERE id = $1 AND user_id = $2`,
      [goalId, userId]
    );
    if (goal.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goalData = goal.rows[0];
    const baseXP = 100;
    let bonus = 0;
    if (goalData.category === 'academic') bonus = 50;
    else if (goalData.category === 'skill') bonus = 75;
    else if (goalData.category === 'career') bonus = 100;
    else if (goalData.category === 'personal') bonus = 30;
    const xpAwarded = baseXP + bonus + Math.floor(goalData.progress / 10);

    await query(
      `UPDATE goals SET completed = true, completed_at = NOW(), xp_awarded = $1
       WHERE id = $2`,
      [xpAwarded, goalId]
    );
    
    await query(
      `UPDATE users SET xp = xp + $1 WHERE id = $2`,
      [xpAwarded, userId]
    );

    res.json({ success: true, xpAwarded });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ──────────────────────────────────────────────
// UPDATE GOAL
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// DELETE GOAL
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// TOGGLE MILESTONE
// ──────────────────────────────────────────────
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