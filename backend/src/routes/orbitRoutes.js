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

export default router;