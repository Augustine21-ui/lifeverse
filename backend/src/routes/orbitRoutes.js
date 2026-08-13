import express from 'express';
import { generate, start, end, feedback, getWeaknesses } from '../controllers/orbitController.js';
import { authenticate } from '../middleware/auth.js'; // adjust path if your auth middleware is elsewhere

const router = express.Router();

router.post('/generate', authenticate, generate);
router.post('/session/start', authenticate, start);
router.post('/session/end', authenticate, end);
router.post('/feedback', authenticate, feedback);
router.get('/weaknesses', authenticate, getWeaknesses);

export default router;