// backend/src/controllers/goalsController.js
// ✅ COMPLETE - With mood triggers on milestone & completion

import db from '../config/db.js';

// ─── List goals ────────────────────────────────────────────
export const getGoals = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });

    const result = await db.query(
      `SELECT id, title, description, due_date, completed,
              progress, xp_reward, category, status, milestones,
              target_date, created_at
       FROM goals
       WHERE user_id = $1
       ORDER BY completed ASC, COALESCE(due_date, NOW() + INTERVAL '1 year') ASC`,
      [userId]
    );

    res.json({ success: true, goals: result.rows });
  } catch (err) {
    console.error('getGoals error:', err);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
};

// ─── Create goal ───────────────────────────────────────────
export const createGoal = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });

    const {
      title, description, due_date, xp_reward,
      category, milestones, target_date,
    } = req.body;

    if (!title) return res.status(400).json({ error: 'Title is required' });

    const result = await db.query(
      `INSERT INTO goals
         (user_id, title, description, due_date, xp_reward, category,
          milestones, target_date, progress, completed, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, FALSE, NOW())
       RETURNING *`,
      [
        userId,
        title,
        description || null,
        due_date || null,
        xp_reward || 50,
        category || 'general',
        milestones ? JSON.stringify(milestones) : null,
        target_date || null,
      ]
    );

    res.status(201).json({ success: true, goal: result.rows[0] });
  } catch (err) {
    console.error('createGoal error:', err);
    res.status(500).json({ error: 'Failed to create goal' });
  }
};

// ─── Update goal ───────────────────────────────────────────
export const updateGoal = async (req, res) => {
  try {
    const userId = req.user?.id;
    const goalId = req.params.id;
    const updates = req.body;

    const allowed = ['title', 'description', 'due_date', 'xp_reward', 'category', 'milestones', 'target_date', 'progress'];
    const fields = [];
    const values = [];
    let idx = 1;

    for (const key of allowed) {
      if (updates[key] !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(key === 'milestones' && typeof updates[key] === 'object'
          ? JSON.stringify(updates[key])
          : updates[key]);
        idx++;
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(goalId, userId);
    const result = await db.query(
      `UPDATE goals SET ${fields.join(', ')}
       WHERE id = $${idx} AND user_id = $${idx + 1}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({ success: true, goal: result.rows[0] });
  } catch (err) {
    console.error('updateGoal error:', err);
    res.status(500).json({ error: 'Failed to update goal' });
  }
};

// ─── Delete goal ───────────────────────────────────────────
export const deleteGoal = async (req, res) => {
  try {
    const userId = req.user?.id;
    const goalId = req.params.id;

    const result = await db.query(
      `DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id`,
      [goalId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({ success: true, deleted: goalId });
  } catch (err) {
    console.error('deleteGoal error:', err);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
};

// ─── Toggle milestone + mood trigger ───────────────────────
export const toggleMilestone = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id: goalId, milestoneId } = req.params;

    const goalRes = await db.query(
      `SELECT * FROM goals WHERE id = $1 AND user_id = $2`,
      [goalId, userId]
    );

    if (goalRes.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goal = goalRes.rows[0];
    let milestones = goal.milestones;

    if (typeof milestones === 'string') {
      try { milestones = JSON.parse(milestones); } catch { milestones = []; }
    }
    if (!Array.isArray(milestones)) milestones = [];

    const idx = milestones.findIndex(m =>
      String(m.id) === String(milestoneId)
    );

    if (idx === -1) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    milestones[idx].completed = !milestones[idx].completed;

    // Compute progress
    const completedCount = milestones.filter(m => m.completed).length;
    const progress = milestones.length > 0
      ? Math.round((completedCount / milestones.length) * 100)
      : 0;
    const allComplete = progress >= 100;

    let xpAwarded = goal.xp_awarded || 0;
    let newXP = 0;

    // If goal just completed → award XP
    if (allComplete && !goal.completed) {
      newXP = goal.xp_reward || 50;
      xpAwarded += newXP;

      await db.query(
        `UPDATE users SET xp = COALESCE(xp, 0) + $1 WHERE id = $2`,
        [newXP, userId]
      );
    }

    // Update goal
    const updated = await db.query(
      `UPDATE goals
       SET milestones = $1,
           progress = $2,
           completed = $3,
           completed_at = CASE WHEN $3 = TRUE AND completed_at IS NULL THEN NOW() ELSE completed_at END,
           xp_awarded = $4
       WHERE id = $5
       RETURNING *`,
      [JSON.stringify(milestones), progress, allComplete, xpAwarded, goalId]
    );

    // Determine mood event
    let moodEvent = null;
    if (allComplete && !goal.completed) {
      moodEvent = 'goal-complete';
    } else if (milestones[idx].completed) {
      moodEvent = 'goal-progress';
    }

    res.json({
      success: true,
      goal: updated.rows[0],
      milestone: milestones[idx],
      progress,
      allComplete,
      xpAwarded: newXP,
      moodEvent,   // 👈 frontend triggers mood based on this
    });
  } catch (err) {
    console.error('toggleMilestone error:', err);
    res.status(500).json({ error: 'Failed to toggle milestone' });
  }
};

// ─── Mark goal complete directly ───────────────────────────
export const completeGoal = async (req, res) => {
  try {
    const userId = req.user?.id;
    const goalId = req.params.id;

    const goalRes = await db.query(
      `SELECT * FROM goals WHERE id = $1 AND user_id = $2`,
      [goalId, userId]
    );

    if (goalRes.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goal = goalRes.rows[0];
    const alreadyCompleted = goal.completed === true;
    const xp = goal.xp_reward || 50;

    if (!alreadyCompleted) {
      await db.query(
        `UPDATE users SET xp = COALESCE(xp, 0) + $1 WHERE id = $2`,
        [xp, userId]
      );
    }

    const result = await db.query(
      `UPDATE goals
       SET completed = TRUE,
           progress = 100,
           completed_at = NOW(),
           xp_awarded = COALESCE(xp_awarded, 0) + $1
       WHERE id = $2
       RETURNING *`,
      [alreadyCompleted ? 0 : xp, goalId]
    );

    res.json({
      success: true,
      goal: result.rows[0],
      xpAwarded: alreadyCompleted ? 0 : xp,
      moodEvent: alreadyCompleted ? null : 'goal-complete',
    });
  } catch (err) {
    console.error('completeGoal error:', err);
    res.status(500).json({ error: 'Failed to complete goal' });
  }
};

// ─── Get actions for a goal ────────────────────────────────
export const getGoalActions = async (req, res) => {
  try {
    const userId = req.user?.id;
    const goalId = req.params.id;

    const result = await db.query(
      `SELECT * FROM goal_actions
       WHERE goal_id = $1 AND goal_id IN (
         SELECT id FROM goals WHERE user_id = $2
       )
       ORDER BY created_at DESC`,
      [goalId, userId]
    );

    res.json({ success: true, actions: result.rows });
  } catch (err) {
    console.error('getGoalActions error:', err);
    res.status(500).json({ error: 'Failed to fetch actions' });
  }
};