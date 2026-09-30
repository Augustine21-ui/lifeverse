// backend/src/controllers/dashboardController.js
import pool from '../config/db.js';
import { updateUserStreak } from '../utils/streakUtils.js';

// ─── User timezone helper (Africa/Nairobi = EAT, UTC+3) ──
const USER_TIMEZONE = 'Africa/Nairobi';

// SQL snippet: true if column value is "today" in the user's timezone
const isTodayInUserTZ = (column) =>
  `(${column} AT TIME ZONE 'UTC' AT TIME ZONE '${USER_TIMEZONE}')::date =
   (NOW() AT TIME ZONE '${USER_TIMEZONE}')::date`;

// ============================================================
// HELPER: Compute composite progress
// Weights: Orbit 30% | Skills 30% | Goals 30% | Tasks 10%
// ============================================================
const computeProgress = async (userId) => {
  try {
    const ORBIT_TARGET = 10;
    const orbitRes = await pool.query(
      `SELECT COUNT(*) AS cnt FROM orbit_sessions
       WHERE user_id = $1 AND status = 'completed'`,
      [userId]
    );
    const orbitCount = parseInt(orbitRes.rows[0]?.cnt || 0, 10);
    const orbitProgress = Math.min((orbitCount / ORBIT_TARGET) * 100, 100);

    let skillsProgress = 0;
    let skillCount = 0;
    try {
      const skillsRes = await pool.query(
        `SELECT COALESCE(AVG(progress_percent), 0) AS avg_progress,
                COUNT(*) AS cnt
         FROM user_skills WHERE user_id = $1`,
        [userId]
      );
      skillCount = parseInt(skillsRes.rows[0]?.cnt || 0, 10);
      skillsProgress = skillCount > 0 ? parseFloat(skillsRes.rows[0].avg_progress || 0) : 0;
    } catch (e) { console.warn('Skills progress query failed:', e.message); }

    let goalsProgress = 0;
    let goalsTotal = 0;
    let goalsCompleted = 0;
    try {
      const goalsRes = await pool.query(
        `SELECT COALESCE(AVG(progress), 0) AS avg_progress,
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE completed = true) AS completed
         FROM goals WHERE user_id = $1`,
        [userId]
      );
      goalsTotal = parseInt(goalsRes.rows[0]?.total || 0, 10);
      goalsCompleted = parseInt(goalsRes.rows[0]?.completed || 0, 10);
      goalsProgress = goalsTotal > 0 ? parseFloat(goalsRes.rows[0].avg_progress || 0) : 0;
    } catch (e) { console.warn('Goals progress query failed:', e.message); }

    let tasksProgress = 0;
    let tasksDone = 0;
    let tasksTotal = 0;
    try {
      const tasksRes = await pool.query(
        `SELECT COUNT(*) FILTER (WHERE is_completed = true) AS done,
                COUNT(*) AS total
         FROM tasks WHERE user_id = $1`,
        [userId]
      );
      tasksTotal = parseInt(tasksRes.rows[0]?.total || 0, 10);
      tasksDone = parseInt(tasksRes.rows[0]?.done || 0, 10);
      tasksProgress = tasksTotal > 0 ? (tasksDone / tasksTotal) * 100 : 0;
    } catch (e) { console.warn('Tasks progress query failed:', e.message); }

    const composite = Math.round(
      orbitProgress * 0.30 +
      skillsProgress * 0.30 +
      goalsProgress * 0.30 +
      tasksProgress * 0.10
    );

    return {
      progressPercent: Math.min(Math.max(composite, 0), 100),
      breakdown: {
        orbit: Math.round(orbitProgress),
        skills: Math.round(skillsProgress),
        goals: Math.round(goalsProgress),
        tasks: Math.round(tasksProgress),
        orbitCount, skillCount, goalsTotal, goalsCompleted, tasksDone, tasksTotal,
      },
    };
  } catch (err) {
    console.error('computeProgress error:', err);
    return {
      progressPercent: 0,
      breakdown: { orbit: 0, skills: 0, goals: 0, tasks: 0 },
    };
  }
};

// ============================================================
// HELPER: Aggregate study time from all study sources
// Sources: focus_sessions, orbit_sessions, practice_results, library
// Uses user timezone (Africa/Nairobi) for "today"
// ============================================================
const computeStudyTime = async (userId) => {
  const result = { focus: 0, orbit: 0, practice: 0, library: 0 };

  // 1. Focus sessions (minutes)
  try {
    const r = await pool.query(
      `SELECT COALESCE(SUM(duration), 0) AS minutes
       FROM focus_sessions
       WHERE user_id = $1
         AND completed = true
         AND ${isTodayInUserTZ('COALESCE(completed_at, start_time)')}`,
      [userId]
    );
    result.focus = parseInt(r.rows[0]?.minutes || 0, 10);
  } catch (e) { console.warn('Focus study time failed:', e.message); }

  // 2. Orbit sessions (time_spent in seconds)
  try {
    const r = await pool.query(
      `SELECT COALESCE(SUM(time_spent), 0) AS seconds
       FROM orbit_sessions
       WHERE user_id = $1
         AND status = 'completed'
         AND ${isTodayInUserTZ('completed_at')}`,
      [userId]
    );
    result.orbit = Math.round(parseInt(r.rows[0]?.seconds || 0, 10) / 60);
  } catch (e) { console.warn('Orbit study time failed:', e.message); }

  // 3. Practice results (time_spent in seconds)
  try {
    const r = await pool.query(
      `SELECT COALESCE(SUM(time_spent), 0) AS seconds
       FROM practice_results
       WHERE user_id = $1
         AND ${isTodayInUserTZ('completed_at')}`,
      [userId]
    );
    result.practice = Math.round(parseInt(r.rows[0]?.seconds || 0, 10) / 60);
  } catch (e) { console.warn('Practice study time failed:', e.message); }

  // 4. Library reading (~1 minute per page read today)
  try {
    const r = await pool.query(
      `SELECT COALESCE(SUM(LEAST(current_page, total_pages)), 0) AS pages
       FROM library_read_progress
       WHERE user_id = $1
         AND ${isTodayInUserTZ('last_read_at')}`,
      [userId]
    );
    result.library = parseInt(r.rows[0]?.pages || 0, 10);
  } catch (e) { console.warn('Library study time failed:', e.message); }

  const totalMinutes = result.focus + result.orbit + result.practice + result.library;
  return { totalMinutes, breakdown: result };
};

// ============================================================
// GET DASHBOARD STATS
// ============================================================
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const userRes = await pool.query(
      `SELECT id, full_name, username, email, xp, level, streak_days,
              avatar_url, mood, education_level, date_of_birth,
              last_activity_date
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRes.rows[0];

    const { totalMinutes: studyTimeMinutes, breakdown: studyTimeBreakdown } =
      await computeStudyTime(userId);

    const { progressPercent, breakdown } = await computeProgress(userId);

    const xpProgress = (user.xp || 0) % 500;
    const level = Math.floor((user.xp || 0) / 500) + 1;
    const xpPercent = Math.round((xpProgress / 500) * 100);

    const countsRes = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM orbit_sessions WHERE user_id=$1 AND status='completed') AS orbit_count,
         (SELECT COUNT(*) FROM tasks WHERE user_id=$1 AND is_completed=true) AS tasks_done,
         (SELECT COUNT(*) FROM user_skills WHERE user_id=$1) AS skills_count,
         (SELECT COUNT(*) FROM goals WHERE user_id=$1 AND completed=true) AS goals_completed
      `,
      [userId]
    );
    const counts = countsRes.rows[0] || {};

    res.json({
      user: {
        id: user.id,
        fullName: user.full_name,
        username: user.username,
        email: user.email,
        xp: user.xp || 0,
        level,
        xpProgress,
        xpPercent,
        streakDays: user.streak_days || 0,
        avatarUrl: user.avatar_url,
        mood: user.mood || 'neutral',
        educationLevel: user.education_level,
        lastActivityDate: user.last_activity_date,
      },
      studyTimeMinutes,
      studyTimeBreakdown,
      progressPercent,
      progressBreakdown: breakdown,
      totalXP: user.xp || 0,
      level,
      streakDays: user.streak_days || 0,
      orbitCount: parseInt(counts.orbit_count || 0, 10),
      tasksDone: parseInt(counts.tasks_done || 0, 10),
      skillsCount: parseInt(counts.skills_count || 0, 10),
      goalsCompleted: parseInt(counts.goals_completed || 0, 10),
    });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

// ============================================================
// GET DASHBOARD (backwards compatibility)
// ============================================================
export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [userRes, goalsRes, badgesRes, xpHistRes] = await Promise.all([
      pool.query('SELECT xp, level, streak_days, last_activity_date FROM users WHERE id=$1', [userId]),
      pool.query(`
        SELECT category, COUNT(*) FILTER (WHERE status='active') as active,
          COUNT(*) FILTER (WHERE status='completed') as completed
        FROM goals WHERE user_id=$1 GROUP BY category
      `, [userId]),
      pool.query(`
        SELECT b.*, ub.earned_at FROM badges b
        JOIN user_badges ub ON ub.badge_id=b.id
        WHERE ub.user_id=$1 ORDER BY ub.earned_at DESC LIMIT 6
      `, [userId]),
      pool.query(`
        SELECT DATE(created_at) as date, SUM(xp_gained) as xp
        FROM xp_history WHERE user_id=$1 AND created_at > NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at) ORDER BY date
      `, [userId]),
    ]);

    const user = userRes.rows[0];
    const xpProgress = user.xp % 500;
    const level = Math.floor(user.xp / 500) + 1;

    const { progressPercent, breakdown } = await computeProgress(userId);
    const { totalMinutes: studyTimeMinutes, breakdown: studyTimeBreakdown } =
      await computeStudyTime(userId);

    let mood = 'neutral';
    if (user.streak_days > 0) mood = 'calm';
    if (user.xp > 500) mood = 'happy';

    res.json({
      user: {
        xp: user.xp,
        level: level,
        streakDays: user.streak_days,
        xpProgress,
        xpPercent: Math.round((xpProgress / 500) * 100),
        mood: mood,
        lastActivityDate: user.last_activity_date || null,
      },
      studyTimeMinutes,
      studyTimeBreakdown,
      progressPercent,
      progressBreakdown: breakdown,
      goalsByCategory: goalsRes.rows,
      recentBadges: badgesRes.rows,
      xpHistory: xpHistRes.rows,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET BADGES
// ============================================================
export const getBadges = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT b.*,
        CASE WHEN ub.user_id IS NOT NULL THEN true ELSE false END as earned,
        ub.earned_at
      FROM badges b
      LEFT JOIN user_badges ub ON ub.badge_id=b.id AND ub.user_id=$1
      ORDER BY b.category, b.requirement_value
    `, [req.user.id]);
    res.json({ badges: result.rows });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET LEADERBOARD
// ============================================================
export const getLeaderboard = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.username, u.full_name, u.avatar_url, u.xp, u.level, u.streak_days,
        (SELECT COUNT(*) FROM user_badges WHERE user_id=u.id) as badges_count
      FROM users u
      ORDER BY u.xp DESC LIMIT 20
    `);
    res.json({ leaderboard: result.rows });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// COMPLETE FOCUS SESSION (timezone-aware)
// ============================================================
export const completeFocusSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { durationMinutes, topic } = req.body;

    if (!durationMinutes || durationMinutes < 1) {
      return res.status(400).json({ error: 'Duration is required' });
    }

    const xpAwarded = Math.round(durationMinutes * 10);

    await pool.query(
      `INSERT INTO focus_sessions 
       (user_id, topic, duration, start_time, end_time, completed, completed_at, xp_awarded)
       VALUES ($1, $2, $3, NOW(), NOW(), true, NOW(), $4)`,
      [userId, topic || 'Focus Session', durationMinutes, xpAwarded]
    );

    await pool.query(`UPDATE users SET xp = xp + $1 WHERE id = $2`, [xpAwarded, userId]);
    await pool.query(`UPDATE users SET level = FLOOR(xp / 500) + 1 WHERE id = $1`, [userId]);

    await updateUserStreak(userId);

    const remainingRes = await pool.query(
      `SELECT 4 - COUNT(*) AS remaining
       FROM focus_sessions
       WHERE user_id = $1 AND ${isTodayInUserTZ('start_time')} AND completed = true`,
      [userId]
    );
    const remaining = parseInt(remainingRes.rows[0].remaining, 10) || 0;

    res.json({
      success: true,
      xpAwarded,
      remaining: Math.max(0, remaining),
      message: `Focus session completed! +${xpAwarded} XP`,
    });
  } catch (err) {
    console.error('Complete focus session error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// GET FOCUS REMAINING (timezone-aware)
// ============================================================
export const getFocusRemaining = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT 4 - COUNT(*) AS remaining
       FROM focus_sessions
       WHERE user_id = $1 AND ${isTodayInUserTZ('start_time')} AND completed = true`,
      [userId]
    );
    const remaining = parseInt(result.rows[0].remaining, 10) || 0;
    res.json({ remaining: Math.max(0, remaining) });
  } catch (err) {
    console.error('Get focus remaining error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// TASK FUNCTIONS
// ============================================================
export const getTodayTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT id, title, xp_reward, is_completed, due_date, priority, created_at, completed_at
       FROM tasks
       WHERE user_id = $1
         AND (due_date IS NULL OR due_date::date <= CURRENT_DATE)
       ORDER BY is_completed ASC, priority DESC NULLS LAST, created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getTodayTasks error:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

export const completeTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const taskRes = await pool.query(
      `SELECT * FROM tasks WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (taskRes.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskRes.rows[0];
    const alreadyDone = task.is_completed;
    const xp = task.xp_reward || 30;

    if (!alreadyDone) {
      await pool.query(`UPDATE users SET xp = COALESCE(xp, 0) + $1 WHERE id = $2`, [xp, userId]);
      await pool.query(`UPDATE users SET level = FLOOR(COALESCE(xp,0) / 500) + 1 WHERE id = $1`, [userId]);
      await updateUserStreak(userId);
    }

    const result = await pool.query(
      `UPDATE tasks SET is_completed = TRUE, completed_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );

    res.json({ success: true, task: result.rows[0], xpAwarded: alreadyDone ? 0 : xp });
  } catch (err) {
    console.error('completeTask error:', err);
    res.status(500).json({ error: 'Failed to complete task' });
  }
};

export const createTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, xp_reward, due_date, priority } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const result = await pool.query(
      `INSERT INTO tasks (user_id, title, xp_reward, due_date, priority, is_completed, created_at)
       VALUES ($1, $2, $3, $4, $5, false, NOW()) RETURNING *`,
      [userId, title, xp_reward || 30, due_date || null, priority || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createTask error:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await pool.query(
      `DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true, deletedId: result.rows[0].id });
  } catch (err) {
    console.error('deleteTask error:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

export const getTodayChallenges = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT c.id, c.title, c.description, c.xp_reward, c.difficulty,
              uc.status AS user_status, uc.completed_at
       FROM challenges c
       LEFT JOIN user_challenges uc
         ON uc.challenge_id = c.id AND uc.user_id = $1
       WHERE c.expires_at IS NULL OR c.expires_at > NOW()
       ORDER BY c.xp_reward DESC NULLS LAST
       LIMIT 10`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getTodayChallenges error:', err);
    res.json([]);
  }
};