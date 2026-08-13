import express from 'express';
import { explain } from '../controllers/aiController.js';
import { chat } from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.post('/explain', authenticate, explain);
router.post('/chat', authenticate, chat); // new route

export default router;