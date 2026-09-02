// backend/src/controllers/dashboardController.js
import pool from '../config/db.js';

export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [userRes, goalsRes, badgesRes, xpHistRes, activityRes] = await Promise.all([
      pool.query('SELECT xp, level, streak_days FROM users WHERE id=$1', [userId]),
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
      // ─── New: aggregate today's activities ─────────────────
      pool.query(`
        SELECT
          COALESCE((SELECT COUNT(*) FROM tasks WHERE user_id=$1 AND is_completed=true AND DATE(completed_at)=CURRENT_DATE), 0) AS tasks_done,
          COALESCE((SELECT COUNT(*) FROM orbit_sessions WHERE user_id=$1 AND status='completed' AND DATE(completed_at)=CURRENT_DATE), 0) AS orbit_sessions,
          COALESCE((SELECT COUNT(*) FROM posts WHERE user_id=$1 AND DATE(created_at)=CURRENT_DATE), 0) AS posts,
          COALESCE((SELECT COUNT(*) FROM user_skills WHERE user_id=$1 AND DATE(updated_at)=CURRENT_DATE), 0) AS skill_updates,
          COALESCE((SELECT COALESCE(SUM(duration_minutes),0) FROM focus_sessions WHERE user_id=$1 AND DATE(started_at)=CURRENT_DATE), 0) AS study_minutes,
          COALESCE((SELECT COUNT(*) FROM tasks WHERE user_id=$1 AND is_completed=false AND due_date < NOW()), 0) AS overdue_tasks
      `, [userId])
    ]);

    const user = userRes.rows[0];
    const xpProgress = user.xp % 500;
    const level = Math.floor(user.xp / 500) + 1; // consistent with auth

    // ─── Composite progress score ───────────────────────────
    const activity = activityRes.rows[0];
    const totalPoints = (activity.tasks_done * 1) + (activity.orbit_sessions * 1) +
                        (activity.posts * 0.5) + (activity.skill_updates * 0.5);
    const maxPoints = 10;
    const progressPercent = Math.min(100, Math.round((totalPoints / maxPoints) * 100));

    // ─── Auto‑mood based on activity ──────────────────────
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
        mood: mood,                      // send auto‑mood
      },
      studyTimeMinutes: activity.study_minutes,
      progressPercent: progressPercent,
      goalsByCategory: goalsRes.rows,
      recentBadges: badgesRes.rows,
      xpHistory: xpHistRes.rows,
    });
  } catch (err) { next(err); }
};

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
  } catch (err) { next(err); }
};

export const getLeaderboard = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.username, u.full_name, u.avatar_url, u.xp, u.level, u.streak_days,
        (SELECT COUNT(*) FROM user_badges WHERE user_id=u.id) as badges_count
      FROM users u
      ORDER BY u.xp DESC LIMIT 20
    `);
    res.json({ leaderboard: result.rows });
  } catch (err) { next(err); }
};