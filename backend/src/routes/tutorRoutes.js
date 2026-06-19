import express from 'express';
import { chat, getConversationHistory } from '../controllers/tutorController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Protect all tutor routes
router.use(authenticate);

// Chat endpoint
router.post('/tutor/chat', chat);

// Get conversation history
router.get('/conversation/:conversationId', getConversationHistory);

export default router;