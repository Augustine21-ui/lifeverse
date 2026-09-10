// backend/src/routes/orbitRoutes.js
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import db from '../config/db.js';
import {
  startSession,
  endSession,
  generateActivity,
  submitAnswer,
  getProgress,
  getWeaknesses,
  getWeaknessSuggestions,
  getStackedSuggestions,   // ← NEW
  feedback
} from '../controllers/orbitController.js';

const router = express.Router();

router.use(authenticate);

// ─── COUNT ────────────────────────────────────────────────
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

// ─── STACKED SUGGESTIONS ─────────────────────────────────
router.get('/stacked-suggestions', getStackedSuggestions);

// ─── WEAKNESS SUGGESTIONS ────────────────────────────────
router.get('/weaknesses/suggestions', getWeaknessSuggestions);

// Session management
router.post('/session/start', startSession);
router.post('/session/end', endSession);

// Activity management
router.post('/generate', generateActivity);
router.post('/submit', submitAnswer);

// Progress & weaknesses
router.get('/progress', getProgress);
router.get('/weaknesses', getWeaknesses);

// Legacy feedback
router.post('/feedback', feedback);

// Debug
router.post('/session/end-debug', async (req, res) => {
  res.json({ success: true, message: 'Debug endpoint', received: req.body });
});

export default router;