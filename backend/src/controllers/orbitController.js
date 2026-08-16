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

export const endSession = async (req, res) => {
  try {
    const { sessionId, score, totalQuestions, correctAnswers, timeSpent } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    const result = await orbitService.endSession(
      sessionId, score || 0, totalQuestions || 0, correctAnswers || 0, timeSpent || 0
    );

    res.json({ success: true, session: result });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({ error: error.message });
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