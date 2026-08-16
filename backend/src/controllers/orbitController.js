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

// backend/src/controllers/orbitController.js
// ✅ DEBUG VERSION - Shows exact error

export const endSession = async (req, res) => {
  try {
    console.log('🏁 endSession called');
    console.log('📥 Request body:', req.body);
    console.log('👤 User:', req.user);

    const { sessionId, score, totalQuestions, correctAnswers, timeSpent } = req.body;
    const userId = req.user.id;

    // Validate sessionId
    if (!sessionId) {
      console.log('❌ Missing sessionId');
      return res.status(400).json({
        success: false,
        message: 'sessionId is required'
      });
    }

    console.log('📊 Session data:', { sessionId, score, totalQuestions, correctAnswers, timeSpent });

    // Convert to proper types
    const sessionIdStr = String(sessionId);
    const scoreNum = Number(score) || 0;
    const totalQuestionsNum = Number(totalQuestions) || 0;
    const correctAnswersNum = Number(correctAnswers) || 0;
    const timeSpentNum = Number(timeSpent) || 0;

    console.log('📊 Converted types:', {
      sessionIdStr,
      scoreNum,
      totalQuestionsNum,
      correctAnswersNum,
      timeSpentNum
    });

    // Check if session exists
    const sessionCheck = await db.query(
      'SELECT * FROM orbit_sessions WHERE id = $1 AND user_id = $2',
      [sessionIdStr, userId]
    );

    console.log('📊 Session check result:', sessionCheck.rows);

    if (sessionCheck.rows.length === 0) {
      console.log('❌ Session not found');
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const session = sessionCheck.rows[0];
    console.log('📊 Found session:', session);

    // Calculate XP
    const xpEarned = Math.round(
      (correctAnswersNum / Math.max(totalQuestionsNum, 1)) * 50 + 10
    );
    console.log('📊 XP earned:', xpEarned);

    // Simple update - try the most basic version first
    try {
      const updateResult = await db.query(
        `UPDATE orbit_sessions 
         SET status = 'completed', 
             completed_at = NOW() 
         WHERE id = $1 
         RETURNING *`,
        [sessionIdStr]
      );
      console.log('📊 Update result:', updateResult.rows);
    } catch (updateError) {
      console.error('❌ Update failed:', updateError.message);
      console.error('❌ Update error details:', updateError);
      throw updateError;
    }

    // Update user XP
    try {
      await db.query(
        'UPDATE users SET xp = xp + $1 WHERE id = $2',
        [xpEarned, userId]
      );
      console.log('📊 XP updated for user:', userId);
    } catch (xpError) {
      console.error('❌ XP update failed:', xpError.message);
      // Don't throw - user XP update is non-critical
    }

    res.json({
      success: true,
      session: session,
      xpEarned,
      message: 'Session ended successfully'
    });

  } catch (error) {
    console.error('❌ endSession ERROR:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error message:', error.message);
    
    // Return detailed error
    res.status(500).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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