// backend/src/models/orbitModels.js
import db from '../config/db.js';

// ============================================================
// SESSION MANAGEMENT
// ============================================================

export const createSession = async (userId, subject, topic, orbitType, activityType) => {
  const result = await db.query(
    `INSERT INTO orbit_sessions (user_id, subject, topic, orbit_type, activity_type)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, subject, topic, orbitType, activityType]
  );
  return result.rows[0];
};

export const getSession = async (sessionId) => {
  const result = await db.query(
    `SELECT * FROM orbit_sessions WHERE id = $1`,
    [sessionId]
  );
  return result.rows[0] || null;
};

export const updateSession = async (sessionId, updates) => {
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const result = await db.query(
    `UPDATE orbit_sessions SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
    [...values, sessionId]
  );
  return result.rows[0];
};

export const completeSession = async (sessionId, score, totalQuestions, correctAnswers, timeSpent, xpEarned) => {
  const result = await db.query(
    `UPDATE orbit_sessions SET 
       status = 'completed',
       score = $1,
       total_questions = $2,
       correct_answers = $3,
       time_spent = $4,
       xp_earned = $5,
       completed_at = NOW()
     WHERE id = $6
     RETURNING *`,
    [score, totalQuestions, correctAnswers, timeSpent, xpEarned, sessionId]
  );
  return result.rows[0];
};

// ============================================================
// ACTIVITY MANAGEMENT
// ============================================================

export const saveActivity = async (sessionId, activityType, content) => {
  const result = await db.query(
    `INSERT INTO orbit_activities (session_id, activity_type, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [sessionId, activityType, content]
  );
  return result.rows[0];
};

export const submitActivityAnswer = async (activityId, userAnswer, isCorrect, timeTaken) => {
  const result = await db.query(
    `UPDATE orbit_activities SET 
       user_answer = $1,
       is_correct = $2,
       time_taken = $3
     WHERE id = $4
     RETURNING *`,
    [userAnswer, isCorrect, timeTaken, activityId]
  );
  return result.rows[0];
};

export const getActivitiesBySession = async (sessionId) => {
  const result = await db.query(
    `SELECT * FROM orbit_activities WHERE session_id = $1 ORDER BY created_at ASC`,
    [sessionId]
  );
  return result.rows;
};

// ============================================================
// WEAKNESS & MASTERY TRACKING
// ============================================================

export const updateWeakness = async (userId, subject, topic, concept, isCorrect) => {
  const checkResult = await db.query(
    `SELECT * FROM orbit_weaknesses WHERE user_id = $1 AND subject = $2 AND topic = $3 AND concept = $4`,
    [userId, subject, topic, concept]
  );

  if (checkResult.rows.length > 0) {
    const weak = checkResult.rows[0];
    const newCount = weak.encountered_count + 1;
    const mastered = isCorrect && newCount >= 3;

    await db.query(
      `UPDATE orbit_weaknesses SET 
         encountered_count = $1,
         last_encountered = NOW(),
         mastered = $2
       WHERE id = $3`,
      [newCount, mastered, weak.id]
    );
  } else {
    await db.query(
      `INSERT INTO orbit_weaknesses (user_id, subject, topic, concept, encountered_count, mastered)
       VALUES ($1, $2, $3, $4, 1, $5)`,
      [userId, subject, topic, concept, isCorrect]
    );
  }
};

export const updateMastery = async (userId, subject, topic, isCorrect, xpEarned) => {
  const result = await db.query(
    `SELECT * FROM orbit_mastery WHERE user_id = $1 AND subject = $2 AND topic = $3`,
    [userId, subject, topic]
  );

  if (result.rows.length > 0) {
    const mastery = result.rows[0];
    const newTotal = mastery.total_activities + 1;
    const newCorrect = mastery.correct_activities + (isCorrect ? 1 : 0);
    const newLevel = Math.round((newCorrect / newTotal) * 100);

    await db.query(
      `UPDATE orbit_mastery SET 
         total_activities = $1,
         correct_activities = $2,
         mastery_level = $3,
         last_activity = NOW()
       WHERE id = $4`,
      [newTotal, newCorrect, newLevel, mastery.id]
    );
  } else {
    await db.query(
      `INSERT INTO orbit_mastery (user_id, subject, topic, total_activities, correct_activities, mastery_level)
       VALUES ($1, $2, $3, 1, $2, $3)`,
      [userId, subject, topic, isCorrect ? 1 : 0, isCorrect ? 100 : 0]
    );
  }
};

// ============================================================
// HISTORY & PROGRESS
// ============================================================

export const saveActivityHistory = async (userId, sessionId, activityType, orbitType, subject, topic, score, totalQuestions, correctAnswers, timeSpent, xpEarned) => {
  const result = await db.query(
    `INSERT INTO orbit_activity_history 
       (user_id, session_id, activity_type, orbit_type, subject, topic, score, total_questions, correct_answers, time_spent, xp_earned)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [userId, sessionId, activityType, orbitType, subject, topic, score, totalQuestions, correctAnswers, timeSpent, xpEarned]
  );
  return result.rows[0];
};

export const getUserProgress = async (userId) => {
  const sessions = await db.query(
    `SELECT * FROM orbit_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
    [userId]
  );

  const mastery = await db.query(
    `SELECT * FROM orbit_mastery WHERE user_id = $1 ORDER BY mastery_level DESC`,
    [userId]
  );

  const weaknesses = await db.query(
    `SELECT * FROM orbit_weaknesses WHERE user_id = $1 AND mastered = false ORDER BY encountered_count DESC`,
    [userId]
  );

  return {
    sessions: sessions.rows,
    mastery: mastery.rows,
    weaknesses: weaknesses.rows
  };
};

export const getWeaknessesByUser = async (userId) => {
  const result = await db.query(
    `SELECT * FROM orbit_weaknesses 
     WHERE user_id = $1 AND mastered = false 
     ORDER BY encountered_count DESC, last_encountered DESC`,
    [userId]
  );
  return result.rows;
};