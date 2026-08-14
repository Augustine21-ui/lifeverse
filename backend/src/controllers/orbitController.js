// backend/src/controllers/orbitController.js
import { generateOrbitActivities, startSession, endSession, submitAnswer } from '../services/orbitService.js';
import db from '../config/db.js';

export const generate = async (req, res) => {
  try {
    const { subject, topic, grade, types } = req.body;
    
    // Validate required fields
    if (!subject || !topic) {
      // If missing, use mock data
      return res.json({
        activities: [
          {
            id: Date.now(),
            type: 'cortex',
            subject: subject || 'General',
            topic: topic || 'Learning',
            content: 'Mock orbit activity generated',
            questions: [
              { question: 'What is the main concept?', options: ['A', 'B', 'C', 'D'], correct: 0 }
            ],
            mock: true
          }
        ],
        mock: true,
        message: 'Using mock data - subject or topic missing'
      });
    }

    const activityTypes = types || ['cortex', 'cluepath', 'pathfinder', 'reflex'];
    const activities = await generateOrbitActivities({ subject, topic, grade, activityTypes });
    res.json({ activities, mock: false });
  } catch (error) {
    console.error('Orbit generate error:', error);
    // Fallback to mock data
    res.json({
      activities: [
        {
          id: Date.now(),
          type: 'cortex',
          subject: req.body.subject || 'General',
          topic: req.body.topic || 'Learning',
          content: 'Mock orbit activity generated',
          questions: [
            { question: 'What is the main concept?', options: ['A', 'B', 'C', 'D'], correct: 0 }
          ],
          mock: true
        }
      ],
      mock: true,
      message: error.message
    });
  }
};

export const start = async (req, res) => {
  try {
    const { subject, topic, mixup } = req.body;
    
    if (!subject || !topic) {
      return res.json({
        sessionId: 'mock-' + Date.now().toString(),
        mock: true,
        message: 'Using mock session - subject or topic missing'
      });
    }

    const sessionId = await startSession(req.user.id, subject, topic, mixup);
    res.json({ sessionId, mock: false });
  } catch (error) {
    console.error('Start session error:', error);
    res.json({
      sessionId: 'mock-' + Date.now().toString(),
      mock: true,
      message: error.message
    });
  }
};

export const end = async (req, res) => {
  try {
    const { sessionId, score, completed } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    // Check if it's a mock session
    if (sessionId.startsWith('mock-')) {
      return res.json({ 
        success: true, 
        mock: true,
        message: 'Mock session ended'
      });
    }

    await endSession(sessionId, score || 0, completed || 0);
    res.json({ success: true, mock: false });
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
      
      // For mock sessions, return mock feedback
      if (sessionId && sessionId.startsWith('mock-')) {
        return res.json({ 
          correct: Math.random() > 0.5,
          mock: true,
          message: 'Mock feedback'
        });
      }
      
      return res.status(400).json({ error: 'Missing required fields: sessionId, activityId, answer' });
    }

    // Check if it's a mock session
    if (sessionId.startsWith('mock-')) {
      return res.json({ 
        correct: Math.random() > 0.5,
        mock: true,
        message: 'Mock feedback'
      });
    }

    const correct = await submitAnswer(sessionId, activityId, answer, time || 0);
    res.json({ correct, mock: false });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit answer' });
  }
};

export const getWeaknesses = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.json({
        weaknesses: [],
        mock: true,
        message: 'User not authenticated'
      });
    }

    const result = await db.query(
      `SELECT * FROM orbit_weaknesses WHERE user_id = $1 ORDER BY last_encountered DESC LIMIT 10`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        weaknesses: ['Concept A', 'Concept B', 'Concept C'],
        mock: true,
        message: 'No weaknesses recorded yet'
      });
    }
    
    res.json({ weaknesses: result.rows, mock: false });
  } catch (error) {
    console.error('Get weaknesses error:', error);
    res.json({
      weaknesses: ['Concept A', 'Concept B', 'Concept C'],
      mock: true,
      message: error.message
    });
  }
};