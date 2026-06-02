import pool from '../config/db.js';
import { awardXP, checkAndAwardBadges } from '../models/xp.js';

export const getGoals = async (req, res, next) => {
  try {
    const { status, category } = req.query;
    let query = `
      SELECT g.*, 
        json_agg(m ORDER BY m.order_index) FILTER (WHERE m.id IS NOT NULL) as milestones
      FROM goals g
      LEFT JOIN milestones m ON m.goal_id = g.id
      WHERE g.user_id = $1
    `;
    const params = [req.user.id];
    if (status) { params.push(status); query += ` AND g.status = $${params.length}`; }
    if (category) { params.push(category); query += ` AND g.category = $${params.length}`; }
    query += ' GROUP BY g.id ORDER BY g.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ goals: result.rows });
  } catch (err) { next(err); }
};

export const createGoal = async (req, res, next) => {
  try {
    const { title, description, category, targetValue, unit, dueDate, milestones: milestoneList } = req.body;

    const result = await pool.query(
      `INSERT INTO goals (user_id, title, description, category, target_value, unit, due_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id, title, description, category || 'study', targetValue || 100, unit || 'percent', dueDate || null]
    );
    const goal = result.rows[0];

    if (milestoneList && milestoneList.length > 0) {
      for (let i = 0; i < milestoneList.length; i++) {
        await pool.query(
          'INSERT INTO milestones (goal_id, user_id, title, order_index) VALUES ($1,$2,$3,$4)',
          [goal.id, req.user.id, milestoneList[i], i]
        );
      }
    }

    // Award XP for creating a goal
    await awardXP(req.user.id, 10, 'goal_created', goal.id);

    res.status(201).json({ goal });
  } catch (err) { next(err); }
};

export const updateGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentValue, status, title, description } = req.body;

    const existing = await pool.query('SELECT * FROM goals WHERE id=$1 AND user_id=$2', [id, req.user.id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Goal not found' });

    const goal = existing.rows[0];
    let completedAt = goal.completed_at;
    let newStatus = status || goal.status;

    if (currentValue >= goal.target_value && goal.status === 'active') {
      newStatus = 'completed';
      completedAt = new Date();
      await awardXP(req.user.id, goal.xp_reward, 'goal_completed', id);
      await checkAndAwardBadges(req.user.id);
    }

    const result = await pool.query(
      `UPDATE goals SET current_value=COALESCE($1,current_value), status=$2,
       title=COALESCE($3,title), description=COALESCE($4,description),
       completed_at=$5, updated_at=NOW() WHERE id=$6 RETURNING *`,
      [currentValue, newStatus, title, description, completedAt, id]
    );

    res.json({ goal: result.rows[0] });
  } catch (err) { next(err); }
};

export const deleteGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM goals WHERE id=$1 AND user_id=$2', [id, req.user.id]);
    res.json({ message: 'Goal deleted' });
  } catch (err) { next(err); }
};

export const toggleMilestone = async (req, res, next) => {
  try {
    const { id } = req.params;
    const milestone = await pool.query('SELECT * FROM milestones WHERE id=$1 AND user_id=$2', [id, req.user.id]);
    if (!milestone.rows[0]) return res.status(404).json({ error: 'Milestone not found' });

    const current = milestone.rows[0];
    const isCompleting = !current.is_completed;

    const result = await pool.query(
      `UPDATE milestones SET is_completed=$1, completed_at=$2 WHERE id=$3 RETURNING *`,
      [isCompleting, isCompleting ? new Date() : null, id]
    );

    if (isCompleting) {
      await awardXP(req.user.id, 25, 'milestone_completed', id);
      // Update goal progress
      const totalMilestones = await pool.query('SELECT COUNT(*) FROM milestones WHERE goal_id=$1', [current.goal_id]);
      const completedMilestones = await pool.query('SELECT COUNT(*) FROM milestones WHERE goal_id=$1 AND is_completed=true', [current.goal_id]);
      const progress = Math.round((completedMilestones.rows[0].count / totalMilestones.rows[0].count) * 100);
      await pool.query('UPDATE goals SET current_value=$1, updated_at=NOW() WHERE id=$2', [progress, current.goal_id]);
    }

    res.json({ milestone: result.rows[0] });
  } catch (err) { next(err); }
};