// backend/src/routes/orbitRoutes.js
import express from 'express';
import { authenticate } from '../middleware/auth.js';
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

// All orbit routes require authentication
router.use(authenticate);

// Session management
router.post('/session/start', startSession);
router.post('/session/end', endSession);

// Activity management
router.post('/generate', generateActivity);
router.post('/submit', submitAnswer);

// Progress & weaknesses
router.get('/progress', getProgress);
router.get('/weaknesses', getWeaknesses);

// Legacy feedback endpoint
router.post('/feedback', feedback);

router.post('/session/end-debug', async (req, res) => {
  console.log('🔍 Debug endpoint called');
  console.log('📥 Body:', req.body);
  console.log('👤 User:', req.user);
  res.json({ 
    success: true, 
    message: 'Debug endpoint',
    received: req.body 
  });
});

// GET /api/orbit/sessions/count
router.get('/sessions/count', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT COUNT(*) FROM orbit_sessions 
       WHERE user_id = $1 AND status = 'completed'`,
      [req.user.id]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('Orbit count error:', err);
    res.status(500).json({ error: 'Failed to fetch orbit count' });
  }
});

export default router;