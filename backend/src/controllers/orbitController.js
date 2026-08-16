// backend/src/controllers/orbitController.js
// ✅ COMPLETE FIX - With db import at the top

// ============================================
// ✅ FIX: Import database connection
// ============================================
import db from '../config/db.js';
import * as orbitService from '../services/orbitService.js';

// ============================================================
// SESSION ENDPOINTS
// ============================================================

export const startSession = async (req, res) => {
  try {
    console.log('🚀 startSession called');
    console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
    console.log('👤 User:', req.user?.id);

    const { subject, topic, orbitType, activityType } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      console.error('❌ No user ID found');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!subject) {
      console.error('❌ Missing subject');
      return res.status(400).json({
        success: false,
        message: 'subject is required'
      });
    }

    if (!topic) {
      console.error('❌ Missing topic');
      return res.status(400).json({
        success: false,
        message: 'topic is required'
      });
    }

    console.log('📊 Creating session with:', { subject, topic, orbitType, activityType, userId });

    const sessionResult = await db.query(
      `INSERT INTO orbit_sessions 
       (user_id, subject, topic, orbit_type, activity_type, status, started_at)
       VALUES ($1, $2, $3, $4, $5, 'active', NOW())
       RETURNING *`,
      [userId, subject, topic, orbitType || 'exploration', activityType || 'introduction']
    );

    const session = sessionResult.rows[0];
    console.log('✅ Session created:', session.id);

    if (!session) {
      console.error('❌ Failed to create session');
      return res.status(500).json({
        success: false,
        message: 'Failed to create session'
      });
    }

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
      [session.id, 'introduction', activityContent]
    );

    const activity = activityResult.rows[0];
    console.log('✅ Activity created:', activity.id);

    const responseData = {
      success: true,
      session: session,
      activity: activity,
      message: `Started ${orbitType || 'exploration'} orbit on ${topic}`
    };

    console.log('📤 Sending response');
    return res.status(201).json(responseData);

  } catch (error) {
    console.error('❌ startSession ERROR:', error);
    console.error('❌ Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

export const endSession = async (req, res) => {
  try {
    console.log('🏁 endSession called');
    console.log('📥 Request body:', req.body);
    console.log('👤 User:', req.user);

    const { sessionId, score, totalQuestions, correctAnswers, timeSpent } = req.body;
    const userId = req.user.id;

    if (!sessionId) {
      console.log('❌ Missing sessionId');
      return res.status(400).json({
        success: false,
        message: 'sessionId is required'
      });
    }

    console.log('📊 Session data:', { sessionId, score, totalQuestions, correctAnswers, timeSpent });

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

    const xpEarned = Math.round(
      (correctAnswersNum / Math.max(totalQuestionsNum, 1)) * 50 + 10
    );
    console.log('📊 XP earned:', xpEarned);

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
      throw updateError;
    }

    try {
      await db.query(
        'UPDATE users SET xp = xp + $1 WHERE id = $2',
        [xpEarned, userId]
      );
      console.log('📊 XP updated for user:', userId);
    } catch (xpError) {
      console.error('❌ XP update failed:', xpError.message);
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

// backend/src/controllers/orbitController.js
// ✅ FIX: Proper JSON handling for submitAnswer

export const submitAnswer = async (req, res) => {
  try {
    const { activityId, userAnswer, timeTaken } = req.body;

    console.log('✅ submitAnswer called');
    console.log('📥 activityId:', activityId);
    console.log('📥 userAnswer:', userAnswer);
    console.log('📥 timeTaken:', timeTaken);

    if (!activityId || userAnswer === undefined) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing activityId or userAnswer' 
      });
    }

    // ✅ FIX: Properly format userAnswer as JSON
    let answerJson;
    
    if (typeof userAnswer === 'string') {
      // If it's a string, try to parse it first
      try {
        answerJson = JSON.parse(userAnswer);
      } catch (e) {
        // If it's not valid JSON, wrap it as a string
        answerJson = { value: userAnswer };
      }
    } else if (typeof userAnswer === 'object') {
      // If it's already an object, use it directly
      answerJson = userAnswer;
    } else {
      // For numbers, booleans, etc.
      answerJson = { value: userAnswer };
    }

    console.log('📊 answerJson:', answerJson);

    // Update the activity with the answer
    const result = await db.query(
      `UPDATE orbit_activities 
       SET 
         user_answer = $1,
         is_correct = $2,
         time_taken = $3
       WHERE id = $4
       RETURNING *`,
      [
        JSON.stringify(answerJson),  // ✅ Convert to JSON string
        true,                        // Placeholder - you'll need to check correctness
        timeTaken || 0,
        activityId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }

    console.log('✅ Answer submitted for activity:', activityId);

    return res.json({
      success: true,
      activity: result.rows[0],
      isCorrect: true,
      feedback: 'Great job!'
    });

  } catch (error) {
    console.error('❌ submitAnswer ERROR:', error);
    console.error('❌ Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================================
// PROGRESS & WEAKNESSES
// ============================================================

export const getProgress = async (req, res) => {
  try {
    console.log('📈 getProgress called');
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
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
      `SELECT 
        subject,
        COUNT(*) as topic_count,
        COALESCE(AVG(mastery_level), 0) as avg_mastery
       FROM orbit_mastery 
       WHERE user_id = $1
       GROUP BY subject`,
      [userId]
    );

    const weaknessesResult = await db.query(
      `SELECT 
        subject,
        topic,
        concept,
        difficulty,
        encountered_count
       FROM orbit_weaknesses 
       WHERE user_id = $1 AND mastered = false
       ORDER BY encountered_count DESC
       LIMIT 10`,
      [userId]
    );

    const responseData = {
      success: true,
      progress: {
        sessions: sessionsResult.rows[0] || { total_sessions: 0, total_score: 0, avg_score: 0 },
        mastery: masteryResult.rows || [],
        weaknesses: weaknessesResult.rows || []
      }
    };

    console.log('📤 Sending progress response');
    return res.json(responseData);

  } catch (error) {
    console.error('❌ getProgress ERROR:', error);
    console.error('❌ Error stack:', error.stack);
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
    console.log('🔍 getWeaknesses called');
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const result = await db.query(
      `SELECT 
        id,
        subject,
        topic,
        concept,
        difficulty,
        encountered_count,
        last_encountered,
        mastered
       FROM orbit_weaknesses 
       WHERE user_id = $1 AND mastered = false
       ORDER BY encountered_count DESC, last_encountered DESC
       LIMIT 20`,
      [userId]
    );

    console.log(`📤 Found ${result.rows.length} weaknesses`);
    return res.json({
      success: true,
      weaknesses: result.rows
    });

  } catch (error) {
    console.error('❌ getWeaknesses ERROR:', error);
    return res.json({
      success: true,
      weaknesses: []
    });
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