// backend/src/controllers/orbitController.js
// ✅ COMPLETE - Phase B: 5 XP/activity, 50% pass threshold, level-up detection

import db from '../config/db.js';
import * as orbitService from '../services/orbitService.js';
import { updateUserStreak } from '../utils/streakUtils.js';

// ─── Constants ────────────────────────────────────────────
const XP_PER_ACTIVITY = 5;        // 5 XP per completed activity
const PASS_THRESHOLD = 50;        // ≥50% accuracy = pass
const XP_PER_LEVEL = 500;         // level = floor(xp/500) + 1

// ============================================================
// SESSION ENDPOINTS
// ============================================================

export const startSession = async (req, res) => {
  try {
    console.log('🚀 startSession called');
    const { subject, topic, orbitType, activityType } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    if (!subject) {
      return res.status(400).json({ success: false, message: 'subject is required' });
    }
    if (!topic) {
      return res.status(400).json({ success: false, message: 'topic is required' });
    }

    const sessionResult = await db.query(
      `INSERT INTO orbit_sessions 
       (user_id, subject, topic, orbit_type, activity_type, status, started_at)
       VALUES ($1, $2, $3, $4, $5, 'active', NOW())
       RETURNING *`,
      [userId, subject, topic, orbitType || 'exploration', activityType || 'introduction']
    );

    const session = sessionResult.rows[0];
    console.log('✅ Session created:', session.id);

    const activityContent = {
      title: `Welcome to ${topic}`,
      description: `Start exploring ${topic} in the ${orbitType || 'exploration'} orbit!`,
      type: 'introduction'
    };

    const activityResult = await db.query(
      `INSERT INTO orbit_activities 
       (session_id, activity_type, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [session.id, 'introduction', JSON.stringify(activityContent)]
    );

    const activity = activityResult.rows[0];
    console.log('✅ Activity created:', activity.id);

    return res.status(201).json({
      success: true,
      session,
      activity,
      message: `Started ${orbitType || 'exploration'} orbit on ${topic}`
    });
  } catch (error) {
    console.error('❌ startSession ERROR:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── END SESSION ──────────────────────────────────────────
export const endSession = async (req, res) => {
  try {
    const { sessionId, score, totalQuestions, correctAnswers, timeSpent } = req.body;
    const userId = req.user.id;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // 1. Fetch session
    const sessionResult = await db.query(
      `SELECT * FROM orbit_sessions WHERE id = $1 AND user_id = $2`,
      [sessionId, userId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];
    const topic = session.topic;
    const subject = session.subject;

    // 2. Fetch all activities
    const activitiesResult = await db.query(
      `SELECT id, topic, subject, is_correct, activity_type
       FROM orbit_activities
       WHERE session_id = $1`,
      [sessionId]
    );

    const activities = activitiesResult.rows;
    const totalActivities = activities.length;
    const correctActivities = activities.filter(a => a.is_correct === true).length;

    const accuracy = totalActivities > 0 ? correctActivities / totalActivities : 0;
    const accuracyPercent = Math.round(accuracy * 100);

    // 3. PASS/FAIL (>= 50%)
    const passed = accuracyPercent >= PASS_THRESHOLD;

    // 4. XP: 5 per completed activity
    const xpEarned = totalActivities * XP_PER_ACTIVITY;

    // 5. Mark session completed
    await db.query(
      `UPDATE orbit_sessions
       SET status = 'completed',
           completed_at = NOW(),
           score = COALESCE($1, score),
           total_questions = COALESCE($2, total_questions),
           correct_answers = COALESCE($3, correct_answers),
           time_spent = COALESCE($4, time_spent),
           xp_earned = $5
       WHERE id = $6`,
      [
        accuracyPercent,
        totalActivities,
        correctActivities,
        timeSpent || 0,
        xpEarned,
        sessionId,
      ]
    );

    // 6. Award XP + detect level-up
    let oldLevel = 1;
    let newLevel = 1;
    let levelUp = false;
    let totalXP = 0;

    try {
      const before = await db.query(
        `SELECT COALESCE(xp, 0) as xp, COALESCE(level, 1) as level FROM users WHERE id = $1`,
        [userId]
      );
      const currentXP = before.rows[0]?.xp || 0;
      oldLevel = before.rows[0]?.level || 1;

      totalXP = currentXP + xpEarned;
      newLevel = Math.floor(totalXP / XP_PER_LEVEL) + 1;
      levelUp = newLevel > oldLevel;

      await db.query(
        `UPDATE users SET xp = $1, level = $2 WHERE id = $3`,
        [totalXP, newLevel, userId]
      );

      await updateUserStreak(userId);
    } catch (xpErr) {
      console.warn('XP update failed:', xpErr.message);
    }

    // 7. Update orbit_weaknesses
    let weaknessRow = null;
    if (topic) {
      const existing = await db.query(
        `SELECT * FROM orbit_weaknesses
         WHERE user_id = $1 AND subject = $2 AND topic = $3`,
        [userId, subject, topic]
      );

      if (existing.rows.length > 0) {
        const e = existing.rows[0];
        const newCount = (e.encountered_count || 0) + 1;
        const newStrength = Math.round(
          ((e.strength_level || 50) * (newCount - 1) + accuracyPercent) / newCount
        );
        const mastered = newStrength >= 80;

        const updated = await db.query(
          `UPDATE orbit_weaknesses
           SET strength_level = $1,
               last_encountered = NOW(),
               encountered_count = $2,
               mastered = $3,
               difficulty = $4
           WHERE id = $5
           RETURNING *`,
          [
            newStrength,
            newCount,
            mastered,
            newStrength < 50 ? 'high' : newStrength < 80 ? 'medium' : 'low',
            e.id,
          ]
        );
        weaknessRow = updated.rows[0];
      } else {
        const inserted = await db.query(
          `INSERT INTO orbit_weaknesses
             (user_id, subject, topic, strength_level, last_encountered,
              encountered_count, mastered, difficulty, concept)
           VALUES ($1, $2, $3, $4, NOW(), 1, $5, $6, $7)
           RETURNING *`,
          [
            userId,
            subject,
            topic,
            accuracyPercent,
            accuracyPercent >= 80,
            accuracyPercent < 50 ? 'high' : accuracyPercent < 80 ? 'medium' : 'low',
            topic,
          ]
        );
        weaknessRow = inserted.rows[0];
      }
    }

    // 8. Fetch remaining weaknesses (used by frontend on fail)
    const allWeaknesses = await db.query(
      `SELECT subject, topic, strength_level, mastered, difficulty
       FROM orbit_weaknesses
       WHERE user_id = $1 AND mastered = false
       ORDER BY strength_level ASC
       LIMIT 3`,
      [userId]
    );

    // 9. Build response
    const weaknessSummary = {
      accuracyPercent,
      totalActivities,
      correctActivities,
      isWeak: !passed,
      topic,
      subject,
      suggestions: allWeaknesses.rows.map(w => ({
        topic: w.topic,
        subject: w.subject,
        strengthLevel: w.strength_level,
        difficulty: w.difficulty,
        message: `Your ${w.topic} accuracy is at ${w.strength_level}%. Try another Orbit session on this topic to improve.`,
      })),
    };

    const response = {
      success: true,
      sessionId,
      // Outcome
      passed,
      accuracyPercent,
      totalActivities,
      correctActivities,
      passThreshold: PASS_THRESHOLD,
      // XP & level
      xpEarned,
      xpPerActivity: XP_PER_ACTIVITY,
      totalXP,
      oldLevel,
      newLevel,
      levelUp,
      // Weakness
      weaknessSummary,
      currentWeakness: weaknessRow,
    };

    console.log('✅ Session ended:', {
      sessionId,
      passed,
      accuracyPercent,
      xpEarned,
      levelUp,
      oldLevel,
      newLevel,
    });

    res.json(response);
  } catch (err) {
    console.error('❌ Error ending session:', err);
    res.status(500).json({ error: err.message || 'Failed to end session' });
  }
};

// ============================================================
// ACTIVITY ENDPOINTS
// ============================================================

export const generateActivity = async (req, res) => {
  try {
    const { sessionId, activityType } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }
    const activity = await orbitService.generateActivity(sessionId, activityType);
    res.json({ activity });
  } catch (error) {
    console.error('Generate activity error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ─── SUBMIT ANSWER with real correctness check ───────────────
export const submitAnswer = async (req, res) => {
  try {
    const { activityId, userAnswer, timeTaken } = req.body;

    if (!activityId || userAnswer === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing activityId or userAnswer'
      });
    }

    // 1. Fetch activity
    const activityResult = await db.query(
      `SELECT id, content, activity_type FROM orbit_activities WHERE id = $1`,
      [activityId]
    );

    if (activityResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Activity not found' });
    }

    const activity = activityResult.rows[0];

    // 2. Parse content
    let content = activity.content;
    if (typeof content === 'string') {
      try { content = JSON.parse(content); } catch (_) { content = {}; }
    }

    // 3. Find expected answer
    let expectedAnswer = null;
    if (content?.correctAnswer !== undefined) {
      expectedAnswer = content.correctAnswer;
    } else if (content?.answer !== undefined) {
      expectedAnswer = content.answer;
    } else if (Array.isArray(content?.questions) && content.questions[0]?.correctAnswer !== undefined) {
      expectedAnswer = content.questions[0].correctAnswer;
    }

    // 4. Compare
    let isCorrect;
    if (expectedAnswer === null) {
      isCorrect = true; // no expected answer → assume correct
    } else {
      const normalize = (v) => String(v).trim().toLowerCase();
      isCorrect = normalize(userAnswer) === normalize(expectedAnswer);
    }

    // 5. Save
    const answerJson = { value: userAnswer };

    const result = await db.query(
      `UPDATE orbit_activities
       SET user_answer = $1,
           is_correct = $2,
           time_taken = $3
       WHERE id = $4
       RETURNING *`,
      [JSON.stringify(answerJson), isCorrect, timeTaken || 0, activityId]
    );

    return res.json({
      success: true,
      activity: result.rows[0],
      isCorrect,
      feedback: isCorrect ? 'Great job!' : 'Keep learning — try again!',
      expectedAnswer: expectedAnswer ?? null
    });
  } catch (error) {
    console.error('❌ submitAnswer ERROR:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// PROGRESS & WEAKNESSES
// ============================================================

export const getProgress = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const sessionsResult = await db.query(
      `SELECT 
        COUNT(*) as total_sessions,
        COALESCE(SUM(score), 0) as total_score,
        COALESCE(AVG(score), 0) as avg_score
       FROM orbit_sessions 
       WHERE user_id = $1 AND status = 'completed'`,
      [userId]
    );

    const masteryResult = await db.query(
      `SELECT subject, COUNT(*) as topic_count,
              COALESCE(AVG(mastery_level), 0) as avg_mastery
       FROM orbit_mastery WHERE user_id = $1 GROUP BY subject`,
      [userId]
    );

    const weaknessesResult = await db.query(
      `SELECT subject, topic, concept, difficulty, encountered_count
       FROM orbit_weaknesses 
       WHERE user_id = $1 AND mastered = false
       ORDER BY encountered_count DESC LIMIT 10`,
      [userId]
    );

    return res.json({
      success: true,
      progress: {
        sessions: sessionsResult.rows[0] || { total_sessions: 0, total_score: 0, avg_score: 0 },
        mastery: masteryResult.rows || [],
        weaknesses: weaknessesResult.rows || []
      }
    });
  } catch (error) {
    console.error('❌ getProgress ERROR:', error);
    return res.json({
      success: true,
      progress: {
        sessions: { total_sessions: 0, total_score: 0, avg_score: 0 },
        mastery: [],
        weaknesses: []
      }
    });
  }
};

export const getWeaknesses = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const result = await db.query(
      `SELECT id, subject, topic, concept, difficulty,
              encountered_count, last_encountered, mastered
       FROM orbit_weaknesses 
       WHERE user_id = $1 AND mastered = false
       ORDER BY encountered_count DESC, last_encountered DESC LIMIT 20`,
      [userId]
    );

    return res.json({ success: true, weaknesses: result.rows });
  } catch (error) {
    console.error('❌ getWeaknesses ERROR:', error);
    return res.json({ success: true, weaknesses: [] });
  }
};

export const getWeaknessSuggestions = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const result = await db.query(
      `SELECT subject, topic, strength_level, difficulty
       FROM orbit_weaknesses
       WHERE user_id = $1 AND mastered = false
       ORDER BY strength_level ASC LIMIT 3`,
      [userId]
    );

    const suggestions = result.rows.map(w => ({
      topic: w.topic,
      subject: w.subject,
      strengthLevel: w.strength_level,
      difficulty: w.difficulty,
      message: `Weak in ${w.topic} (${w.strength_level}%). Try another Orbit session.`,
    }));

    return res.json({
      success: true,
      hasWeaknesses: suggestions.length > 0,
      suggestions,
    });
  } catch (error) {
    console.error('Weakness suggestions error:', error);
    return res.status(500).json({ error: 'Failed to fetch weakness suggestions' });
  }
};

// ─── STACKED SUGGESTIONS ──────────────────────────────────
export const getStackedSuggestions = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const suggestions = [];

    // 1. SKILL suggestions
    try {
      const weakRes = await db.query(
        `SELECT subject, topic, strength_level, difficulty
         FROM orbit_weaknesses
         WHERE user_id = $1 AND mastered = false
         ORDER BY strength_level ASC LIMIT 5`,
        [userId]
      );

      for (const w of weakRes.rows) {
        suggestions.push({
          id: `skill-${w.subject}-${w.topic}`,
          type: 'skill',
          title: `Practice ${w.topic}`,
          subtitle: `Weak area (${w.strength_level}%)`,
          cta: 'Start Orbit',
          action: 'orbit',
          meta: {
            topic: w.topic,
            subject: w.subject,
            strengthLevel: w.strength_level,
            difficulty: w.difficulty,
          },
          priority: 1,
        });
      }
    } catch (e) {
      console.warn('Skill suggestions failed:', e.message);
    }

    // 2. GOAL suggestions
    try {
      const goalsRes = await db.query(
        `SELECT id, title, progress, xp_reward
         FROM goals
         WHERE user_id = $1
           AND (completed IS NULL OR completed = false)
           AND COALESCE(progress, 0) < 100
         ORDER BY COALESCE(progress, 0) ASC LIMIT 5`,
        [userId]
      );

      for (const g of goalsRes.rows) {
        suggestions.push({
          id: `goal-${g.id}`,
          type: 'goal',
          title: g.title,
          subtitle: `Goal progress: ${g.progress || 0}%`,
          cta: 'Continue',
          action: 'goal',
          meta: { goalId: g.id, progress: g.progress || 0, xpReward: g.xp_reward },
          priority: 2,
        });
      }
    } catch (e) {
      console.warn('Goal suggestions failed:', e.message);
    }

    // 3. TASK suggestions
    try {
      const tasksRes = await db.query(
        `SELECT id, title, xp_reward
         FROM tasks
         WHERE user_id = $1
           AND (is_completed IS NULL OR is_completed = false)
           AND (due_date IS NULL OR due_date::date <= CURRENT_DATE)
         ORDER BY COALESCE(due_date, NOW()) ASC LIMIT 5`,
        [userId]
      );

      for (const t of tasksRes.rows) {
        suggestions.push({
          id: `task-${t.id}`,
          type: 'task',
          title: t.title,
          subtitle: `Task • ${t.xp_reward || 30} XP`,
          cta: 'Complete',
          action: 'task',
          meta: { taskId: t.id, xpReward: t.xp_reward || 30 },
          priority: 3,
        });
      }
    } catch (e) {
      console.warn('Task suggestions failed:', e.message);
    }

    suggestions.sort((a, b) => a.priority - b.priority);

    return res.json({
      success: true,
      count: suggestions.length,
      suggestions,
    });
  } catch (err) {
    console.error('getStackedSuggestions error:', err);
    res.status(500).json({ success: false, error: 'Failed to build suggestions' });
  }
};

// ============================================================
// FEEDBACK (legacy)
// ============================================================

export const feedback = async (req, res) => {
  try {
    const { sessionId, activityId, answer, time } = req.body;
    if (!sessionId || !activityId || answer === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const result = await orbitService.submitAnswer(activityId, answer, time || 0);
    res.json({ correct: result.isCorrect });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ error: error.message });
  }
};