// backend/src/controllers/orbitController.js
import * as orbitService from '../services/orbitService.js';

// ============================================================
// SESSION ENDPOINTS
// ============================================================

export const startSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject, topic, orbitType, activityType } = req.body;

    if (!subject || !topic || !orbitType) {
      return res.status(400).json({ error: 'Missing required fields: subject, topic, orbitType' });
    }

    const session = await orbitService.startSession(
      userId, subject, topic, orbitType, activityType || 'quiz'
    );

    res.json({ sessionId: session.id, session });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ error: error.message });
  }
};

// backend/src/controllers/orbitController.js
// ✅ Fixed endSession with proper type handling

export const endSession = async (req, res) => {
  try {
    const { sessionId, score, totalQuestions, correctAnswers, timeSpent } = req.body;
    const userId = req.user.id;

    console.log('🏁 Ending session:', { sessionId, score, totalQuestions, correctAnswers, timeSpent });

    // Validate inputs
    const sessionIdStr = String(sessionId);
    const scoreInt = parseInt(score) || 0;
    const totalQuestionsInt = parseInt(totalQuestions) || 0;
    const correctAnswersInt = parseInt(correctAnswers) || 0;
    const timeSpentInt = parseInt(timeSpent) || 0;

    // Get the session first to verify ownership
    const sessionResult = await db.query(
      'SELECT * FROM orbit_sessions WHERE id = $1 AND user_id = $2 AND status = $3',
      [sessionIdStr, userId, 'active']
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Active session not found'
      });
    }

    const session = sessionResult.rows[0];

    // Calculate XP earned
    const xpEarned = Math.round(
      (correctAnswersInt / Math.max(totalQuestionsInt, 1)) * 50 + 10
    );

    // Update session with all parameters - use explicit type casting
    const updateResult = await db.query(
      `UPDATE orbit_sessions 
       SET 
         status = 'completed', 
         completed_at = NOW(),
         score = $1,
         total_questions = $2,
         correct_answers = $3,
         time_spent = $4,
         xp_earned = $5
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [
        scoreInt,           // $1: score
        totalQuestionsInt,  // $2: total_questions
        correctAnswersInt,  // $3: correct_answers
        timeSpentInt,       // $4: time_spent
        xpEarned,           // $5: xp_earned
        sessionIdStr,       // $6: id
        userId              // $7: user_id
      ]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Failed to update session'
      });
    }

    // Update user XP
    await db.query(
      'UPDATE users SET xp = xp + $1 WHERE id = $2',
      [xpEarned, userId]
    );

    res.json({
      success: true,
      session: updateResult.rows[0],
      xpEarned,
      message: 'Session ended successfully'
    });
  } catch (error) {
    console.error('❌ endSession error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
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

export const submitAnswer = async (req, res) => {
  try {
    const { activityId, userAnswer, timeTaken } = req.body;

    if (!activityId || userAnswer === undefined) {
      return res.status(400).json({ error: 'Missing activityId or userAnswer' });
    }

    const result = await orbitService.submitAnswer(activityId, userAnswer, timeTaken || 0);
    res.json({ correct: result.isCorrect, activity: result.updated });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================
// PROGRESS & WEAKNESSES
// ============================================================

export const getProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const progress = await orbitService.getProgress(userId);
    res.json(progress);
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getWeaknesses = async (req, res) => {
  try {
    const userId = req.user.id;
    const weaknesses = await orbitService.getWeaknesses(userId);
    res.json({ weaknesses });
  } catch (error) {
    console.error('Get weaknesses error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================================
// FEEDBACK ENDPOINT (legacy support)
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