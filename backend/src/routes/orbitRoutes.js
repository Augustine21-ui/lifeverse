// backend/src/routes/orbitRoutes.js
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import db from '../config/db.js';   // ← ADD THIS
import {
  startSession,
  endSession,
  generateActivity,
  submitAnswer,
  getProgress,
  getWeaknesses,
  feedback
} from '../controllers/orbitController.js';

const router = express.Router();

router.use(authenticate);

// ─── Count completed sessions ──────────────────────────────
router.get('/sessions/count', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT COUNT(*) FROM orbit_sessions 
       WHERE user_id = $1 AND status = 'completed'`,
      [req.user.id]
    );
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error('Orbit count error:', err);
    res.status(500).json({ error: 'Failed to fetch orbit count' });
  }
});

// Session management
router.post('/session/start', startSession);
router.post('/session/end', endSession);

// Activity management
router.post('/generate', generateActivity);
router.post('/submit', submitAnswer);

// Progress
router.get('/progress', getProgress);
router.get('/weaknesses', getWeaknesses);

// Legacy feedback
router.post('/feedback', feedback);

// Debug
router.post('/session/end-debug', async (req, res) => {
  console.log('🔍 Debug endpoint called');
  res.json({ success: true, message: 'Debug endpoint', received: req.body });
});

export default router;