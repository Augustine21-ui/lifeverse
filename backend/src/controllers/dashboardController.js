// backend/src/controllers/dashboardController.js
import pool from '../config/db.js';
import { updateUserStreak } from '../utils/streakUtils.js';

// ============================================================
// HELPER: Compute composite progress
// Weights: Orbit 30% | Skills 30% | Goals 30% | Tasks 10%
// ============================================================
const computeProgress = async (userId) => {
  try {
    // ─── ORBIT: 10 completed sessions = 100% ───────────────
    const ORBIT_TARGET = 10;
    const orbitRes = await pool.query(
      `SELECT COUNT(*) AS cnt FROM orbit_sessions
       WHERE user_id = $1 AND status = 'completed'`,
      [userId]
    );
    const orbitCount = parseInt(orbitRes.rows[0]?.cnt || 0, 10);
    const orbitProgress = Math.min((orbitCount / ORBIT_TARGET) * 100, 100);

    // ─── SKILLS: average of user_skills.progress_percent ───
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
      skillsProgress = skillCount > 0
        ? parseFloat(skillsRes.rows[0].avg_progress || 0)
        : 0;
    } catch (e) {
      console.warn('Skills progress query failed:', e.message);
    }

    // ─── GOALS: average of goals.progress ──────────────────
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
      goalsProgress = goalsTotal > 0
        ? parseFloat(goalsRes.rows[0].avg_progress || 0)
        : 0;
    } catch (e) {
      console.warn('Goals progress query failed:', e.message);
    }

    // ─── TASKS: completed / total ──────────────────────────
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
    } catch (e) {
      console.warn('Tasks progress query failed:', e.message);
    }

    // ─── COMPOSITE ─────────────────────────────────────────
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
        orbitCount,
        skillCount,
        goalsTotal,
        goalsCompleted,
        tasksDone,
        tasksTotal,
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
// GET DASHBOARD STATS (used by frontend DashboardPage)
// Endpoint: GET /api/dashboard/stats
// ============================================================
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. User info
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

    // 2. Study time today
    const studyRes = await pool.query(
      `SELECT COALESCE(SUM(duration), 0) AS minutes
       FROM focus_sessions
       WHERE user_id = $1
         AND completed = true
         AND start_time::date = CURRENT_DATE`,
      [userId]
    );
    const studyTimeMinutes = parseInt(studyRes.rows[0]?.minutes || 0, 10);

    // 3. Composite progress
    const { progressPercent, breakdown } = await computeProgress(userId);

    // 4. Compute level progress
    const xpProgress = (user.xp || 0) % 500;
    const level = Math.floor((user.xp || 0) / 500) + 1;
    const xpPercent = Math.round((xpProgress / 500) * 100);

    // 5. Counts for quick stats
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
      // Top-level keys the frontend reads
      studyTimeMinutes,
      progressPercent,          // 👈 composite %
      progressBreakdown: breakdown,  // 👈 for tooltip/debug
      totalXP: user.xp || 0,
      level,
      streakDays: user.streak_days || 0,
      // Extra stats
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
// GET DASHBOARD (kept for backwards compatibility)
// ============================================================
export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [userRes, goalsRes, badgesRes, xpHistRes, activityRes] = await Promise.all([
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
      pool.query(`
        SELECT
          COALESCE((SELECT COUNT(*) FROM tasks WHERE user_id=$1 AND is_completed=true), 0) AS tasks_done,
          COALESCE((SELECT COUNT(*) FROM orbit_sessions WHERE user_id=$1 AND status='completed'), 0) AS orbit_sessions,
          COALESCE((SELECT COUNT(*) FROM posts WHERE user_id=$1), 0) AS posts,
          COALESCE((SELECT COUNT(*) FROM user_skills WHERE user_id=$1), 0) AS skill_updates,
          COALESCE((SELECT COALESCE(SUM(duration),0) FROM focus_sessions WHERE user_id=$1 AND completed=true), 0) AS study_minutes,
          COALESCE((SELECT COUNT(*) FROM tasks WHERE user_id=$1 AND is_completed=false AND due_date < NOW()), 0) AS overdue_tasks
      `, [userId])
    ]);

    const user = userRes.rows[0];
    const xpProgress = user.xp % 500;
    const level = Math.floor(user.xp / 500) + 1;

    const activity = activityRes.rows[0];

    // ─── Use the new composite progress calculation ─────────
    const { progressPercent, breakdown } = await computeProgress(userId);

    // Mood logic (kept from your original)
    let mood = 'neutral';
    if (activity.tasks_done > 2 || activity.orbit_sessions > 1) mood = 'happy';
    else if (activity.orbit_sessions > 0 || activity.posts > 0) mood = 'calm';
    else if (activity.overdue_tasks > 0) mood = 'stressed';
    else if (user.streak_days === 0) mood = 'tired';
    else mood = 'neutral';

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
      studyTimeMinutes: activity.study_minutes,
      progressPercent: progressPercent,        // 👈 now composite
      progressBreakdown: breakdown,            // 👈 new
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
// GET LEADERBOARD (simple version)
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
// COMPLETE FOCUS SESSION
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
       WHERE user_id = $1 AND DATE(start_time) = CURRENT_DATE AND completed = true`,
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
// GET FOCUS REMAINING
// ============================================================
export const getFocusRemaining = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT 4 - COUNT(*) AS remaining
       FROM focus_sessions
       WHERE user_id = $1 AND DATE(start_time) = CURRENT_DATE AND completed = true`,
      [userId]
    );
    const remaining = parseInt(result.rows[0].remaining, 10) || 0;
    res.json({ remaining: Math.max(0, remaining) });
  } catch (err) {
    console.error('Get focus remaining error:', err);
    res.status(500).json({ error: err.message });
  }
};