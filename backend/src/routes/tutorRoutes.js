import express from 'express';
import { chat, getConversationHistory } from '../controllers/tutorController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Protect all tutor routes
router.use(authenticate);

// Chat endpoint
router.post('/tutor/chat', chat);

// ✅ FIX: Add '/tutor' prefix to match frontend URL
router.get('/tutor/conversation/:conversationId', getConversationHistory);

export default router;