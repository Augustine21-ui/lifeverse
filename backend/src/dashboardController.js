// backend/src/dashboardController.js
import { query } from './db.js';

// Award XP and update level
export const awardXP = async (userId, amount) => {
  const userRes = await query('SELECT xp FROM users WHERE id = $1', [userId]);
  const currentXP = userRes.rows[0]?.xp || 0;
  const newXP = currentXP + amount;
  const newLevel = Math.floor(newXP / 500) + 1;
  await query('UPDATE users SET xp = $1, level = $2 WHERE id = $3', [newXP, newLevel, userId]);
  return { newXP, newLevel };
};

// Helper to evaluate quiz (simplified placeholder � replace with real logic)
const evaluateQuiz = (quiz, answers) => ({ passed: true, score: 100 });

// Simple quiz generator (for lazy creation)
const generateQuiz = (title, description = '') => ({
  questions: [
    {
      question: `What is the main objective of "${title}"?`,
      options: [
        `Understand and apply ${title} concepts`,
        `Memorize ${title} facts`,
        `Ignore ${title} completely`,
      ],
      correct: 0,
    },
    {
      question: `Why is "${title}" important?`,
      options: [
        `It builds foundational skills`,
        `It is only for exams`,
        `It has no real-world use`,
      ],
      correct: 0,
    },
  ],
});

export const getDashboardStats = async (req, res) => {
  const userId = req.user.id;
  try {
    // Total XP
    const totalXPRes = await query('SELECT xp FROM users WHERE id = $1', [userId]);
    const totalXP = totalXPRes.rows[0]?.xp || 0;

    // Today's XP (including challenges)
    const todayXPRes = await query(`
      SELECT COALESCE(SUM(xp_awarded), 0) as today_xp FROM (
        SELECT xp_awarded FROM mood_entries WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE
        UNION ALL
        SELECT xp_reward FROM tasks WHERE user_id = $1 AND is_completed = true AND DATE(updated_at) = CURRENT_DATE
        UNION ALL
        SELECT xp_awarded FROM focus_sessions WHERE user_id = $1 AND DATE(completed_at) = CURRENT_DATE
        UNION ALL
        SELECT xp_awarded FROM user_challenges WHERE user_id = $1 AND status = 'completed' AND DATE(submitted_at) = CURRENT_DATE
      ) as xp_today
    `, [userId]);
    const todayXP = parseInt(todayXPRes.rows[0]?.today_xp) || 0;

    // Streak (including challenges)
    const activityDatesRes = await query(`
      SELECT DISTINCT DATE(created_at) as activity_date FROM mood_entries WHERE user_id = $1
      UNION
      SELECT DISTINCT DATE(updated_at) as activity_date FROM tasks WHERE user_id = $1 AND is_completed = true
      UNION
      SELECT DISTINCT DATE(completed_at) as activity_date FROM focus_sessions WHERE user_id = $1
      UNION
      SELECT DISTINCT DATE(submitted_at) as activity_date FROM user_challenges WHERE user_id = $1 AND status = 'completed'
      ORDER BY activity_date DESC
    `, [userId]);

    const dates = activityDatesRes.rows.map(row => new Date(row.activity_date).toISOString().split('T')[0]);
    let streak = 0;
    if (dates.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (dates[0] === today || dates[0] === yesterday) {
        let currentStreak = 1;
        for (let i = 1; i < dates.length; i++) {
          const prevDate = new Date(dates[i-1]);
          const currDate = new Date(dates[i]);
          const diffDays = (prevDate - currDate) / (1000 * 3600 * 24);
          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
        streak = currentStreak;
      }
    }

    // Rank
    const rankRes = await query(`
      SELECT rank FROM (
        SELECT id, RANK() OVER (ORDER BY xp DESC) as rank FROM users
      ) ranked WHERE id = $1
    `, [userId]);
    const rank = rankRes.rows[0]?.rank || '#N/A';

    // Completed challenges (total, not just today)
    const completedRes = await query(
      'SELECT COUNT(*) as completed FROM user_challenges WHERE user_id = $1 AND status = $2',
      [userId, 'completed']
    );
    const completed = parseInt(completedRes.rows[0]?.completed) || 0;

    res.json({ totalXP, todayXP, streakDays: streak, rank: `#${rank}`, completed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const getTodayTasks = async (req, res) => {
  const userId = req.user.id;
  try {
    // Get user's course and education level for filtering
    const userRes = await query('SELECT course, education_level FROM users WHERE id = $1', [userId]);
    const userCourse = userRes.rows[0]?.course || null;
    const userEduLevel = userRes.rows[0]?.education_level || null;

    // 1. Regular tasks due today
    let tasksSql = `
      SELECT id, title, is_completed, xp_reward, 'task' as source, NULL as goal_id, NULL as milestone_id, quiz
      FROM tasks
      WHERE user_id = $1 AND due_date = CURRENT_DATE
    `;
    const params = [userId];
    if (userCourse) {
      tasksSql += ' AND (course IS NULL OR course = $2)';
      params.push(userCourse);
    }
    const tasksRes = await query(tasksSql, params);

    // 2. Pending milestones from active goals
    let milestonesSql = `
      SELECT
        g.id as goal_id,
        (m->>'id')::int as milestone_id,
        m->>'title' as title,
        false as is_completed,
        FLOOR(g.xp_reward / (SELECT COUNT(*) FROM jsonb_array_elements(g.milestones))) as xp_reward,
        'milestone' as source,
        (m->'quiz') as quiz
      FROM goals g,
      jsonb_array_elements(g.milestones) as m
      WHERE g.user_id = $1
        AND g.status = 'active'
        AND (m->>'is_completed')::boolean = false
    `;
    const milestoneParams = [userId];
    if (userCourse) {
      milestonesSql += ' AND (g.course IS NULL OR g.course = $2)';
      milestoneParams.push(userCourse);
    }
    const milestonesRes = await query(milestonesSql, milestoneParams);

    // Combine and assign synthetic negative IDs to milestones
    const combined = [...tasksRes.rows];
    for (const m of milestonesRes.rows) {
      combined.push({
        id: -(m.goal_id * 10000 + m.milestone_id),
        title: m.title,
        is_completed: m.is_completed,
        xp_reward: m.xp_reward,
        source: m.source,
        goal_id: m.goal_id,
        milestone_id: m.milestone_id,
        quiz: m.quiz,
      });
    }
    res.json(combined);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const completeTask = async (req, res) => {
  const userId = req.user.id;
  const taskId = parseInt(req.params.id, 10);
  const { source, goalId, milestoneId, answers } = req.body;

  try {
    if (source === 'milestone' || taskId < 0) {
      // Milestone task
      const parsedGoalId = parseInt(goalId, 10);
      const parsedMilestoneId = parseInt(milestoneId, 10);
      if (isNaN(parsedGoalId) || isNaN(parsedMilestoneId)) {
        return res.status(400).json({ error: 'Valid goalId and milestoneId required' });
      }

      const goalResult = await query('SELECT milestones, xp_reward, target_value FROM goals WHERE id = $1 AND user_id = $2', [parsedGoalId, userId]);
      if (goalResult.rows.length === 0) return res.status(404).json({ error: 'Goal not found' });
      const goal = goalResult.rows[0];
      let milestones = goal.milestones || [];
      const milestoneIndex = milestones.findIndex(m => m.id === parsedMilestoneId);
      if (milestoneIndex === -1) return res.status(404).json({ error: 'Milestone not found' });
      if (milestones[milestoneIndex].is_completed) return res.json({ success: false, message: 'Already completed' });

      const milestone = milestones[milestoneIndex];
      let quiz = milestone.quiz;
      if (!quiz) {
        quiz = generateQuiz(milestone.title, goal.description || '');
        milestones[milestoneIndex].quiz = quiz;
        await query('UPDATE goals SET milestones = $1 WHERE id = $2', [JSON.stringify(milestones), parsedGoalId]);
      }

      let xpAwarded = 0;
      if (answers !== null && answers !== undefined) {
        const evaluation = evaluateQuiz(quiz, answers);
        if (!evaluation.passed) {
          milestones[milestoneIndex].is_completed = true;
          await query('UPDATE goals SET milestones = $1, current_value = $2 WHERE id = $3', [JSON.stringify(milestones), goal.current_value, parsedGoalId]);
          return res.json({ success: true, xpAwarded: 0, message: `Quiz score ${evaluation.score}% � need at least 50%. No XP awarded.`, score: evaluation.score });
        }
        const totalMilestones = milestones.length;
        if (totalMilestones === 0) return res.status(400).json({ error: 'Goal has no milestones' });
        xpAwarded = Math.floor(goal.xp_reward / totalMilestones);
      } else {
        const totalMilestones = milestones.length;
        if (totalMilestones === 0) return res.status(400).json({ error: 'Goal has no milestones' });
        xpAwarded = Math.floor(goal.xp_reward / totalMilestones);
      }

      milestones[milestoneIndex].is_completed = true;
      const completedCount = milestones.filter(m => m.is_completed).length;
      const totalMilestones = milestones.length;
      const progressPercent = completedCount / totalMilestones;
      const current_value = Math.round(goal.target_value * progressPercent);
      await query('UPDATE goals SET milestones = $1, current_value = $2 WHERE id = $3', [JSON.stringify(milestones), current_value, parsedGoalId]);
      await awardXP(userId, xpAwarded);

      return res.json({ success: true, xpAwarded });
    } else {
      // Regular task
      if (isNaN(taskId)) return res.status(400).json({ error: 'Invalid task ID' });
      const taskRes = await query('SELECT xp_reward, is_completed, quiz FROM tasks WHERE id = $1 AND user_id = $2', [taskId, userId]);
      if (taskRes.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
      if (taskRes.rows[0].is_completed) return res.json({ success: false, message: 'Already completed' });

      const task = taskRes.rows[0];
      let quiz = task.quiz;
      if (!quiz) {
        quiz = generateQuiz(task.title, '');
        await query('UPDATE tasks SET quiz = $1 WHERE id = $2', [JSON.stringify(quiz), taskId]);
      }

      let xpAwarded = 0;
      if (answers !== null && answers !== undefined) {
        const evaluation = evaluateQuiz(quiz, answers);
        if (!evaluation.passed) {
          await query('UPDATE tasks SET is_completed = true, updated_at = NOW() WHERE id = $1', [taskId]);
          return res.json({ success: true, xpAwarded: 0, message: `Quiz score ${evaluation.score}% � need at least 50%. No XP awarded.`, score: evaluation.score });
        }
        xpAwarded = task.xp_reward;
      } else {
        xpAwarded = task.xp_reward;
      }

      await query('UPDATE tasks SET is_completed = true, updated_at = NOW() WHERE id = $1', [taskId]);
      await awardXP(userId, xpAwarded);

      return res.json({ success: true, xpAwarded });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const completeFocusSession = async (req, res) => {
  const userId = req.user.id;
  const { durationMinutes = 25 } = req.body;
  const xp = 30;
  try {
    const countRes = await query(
      'SELECT COUNT(*) FROM focus_sessions WHERE user_id = $1 AND DATE(completed_at) = CURRENT_DATE',
      [userId]
    );
    const todayCount = parseInt(countRes.rows[0].count);
    if (todayCount >= 4) {
      return res.status(400).json({ error: 'Daily focus session limit reached (4 per day).' });
    }
    await query('INSERT INTO focus_sessions (user_id, duration_minutes, xp_awarded) VALUES ($1, $2, $3)', [userId, durationMinutes, xp]);
    await awardXP(userId, xp);
    const remaining = 4 - (todayCount + 1);
    res.json({ success: true, xpAwarded: xp, remaining });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const getFocusRemaining = async (req, res) => {
  const userId = req.user.id;
  try {
    const countRes = await query(
      'SELECT COUNT(*) FROM focus_sessions WHERE user_id = $1 AND DATE(completed_at) = CURRENT_DATE',
      [userId]
    );
    const todayCount = parseInt(countRes.rows[0].count);
    res.json({ remaining: Math.max(0, 4 - todayCount) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getTodayChallenges = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query(
      'SELECT COUNT(*) FROM user_challenges WHERE user_id = $1 AND status = $2 AND DATE(submitted_at) = CURRENT_DATE',
      [userId, 'completed']
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};export const createTask = async (req, res) => {
  const userId = req.user.id;
  const { title, xp_reward = 30, due_date = new Date().toISOString().split('T')[0] } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  try {
    const result = await query(
      'INSERT INTO tasks (user_id, title, xp_reward, due_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, title, xp_reward, due_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteTask = async (req, res) => {
  const userId = req.user.id;
  const taskId = parseInt(req.params.id);
  try {
    const result = await query('DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id', [taskId, userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

