// backend/src/controllers/orbitController.js
import { generateOrbitActivities, startSession, endSession, submitAnswer } from '../services/orbitService.js';
import db from '../config/db.js';

export const generate = async (req, res) => {
  try {
    const { subject, topic, grade, types } = req.body;
    const activityTypes = types || ['cortex', 'cluepath', 'pathfinder', 'reflex'];
    const activities = await generateOrbitActivities({ subject, topic, grade, activityTypes });
    res.json({ activities });
  } catch (error) {
    console.error('Orbit generate error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ... rest of the functions

export const start = async (req, res) => {
  try {
    const { subject, topic, mixup } = req.body;
    if (!subject || !topic) {
      return res.status(400).json({ error: 'Missing subject or topic' });
    }
    const sessionId = await startSession(req.user.id, subject, topic, mixup);
    res.json({ sessionId });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const end = async (req, res) => {
  try {
    const { sessionId, score, completed } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }
    await endSession(sessionId, score || 0, completed || 0);
    res.json({ success: true });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const feedback = async (req, res) => {
  try {
    const { sessionId, activityId, answer, time } = req.body;
    // Validate required fields
    if (!sessionId || !activityId || answer === undefined || answer === null) {
      console.error('Missing fields:', { sessionId, activityId, answer, time });
      return res.status(400).json({ error: 'Missing required fields: sessionId, activityId, answer' });
    }
    const correct = await submitAnswer(sessionId, activityId, answer, time || 0);
    res.json({ correct });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit answer' });
  }
};

export const getWeaknesses = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM orbit_weaknesses WHERE user_id = $1 ORDER BY last_encountered DESC LIMIT 10`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get weaknesses error:', error);
    res.status(500).json({ error: error.message });
  }
};