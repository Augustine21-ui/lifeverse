import express from 'express';
import { getCurrentStudy, updateCurrentStudy } from '../controllers/studyController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.get('/current', authenticate, getCurrentStudy);
router.put('/current', authenticate, updateCurrentStudy);

export default router;