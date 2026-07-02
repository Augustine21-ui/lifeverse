import express from 'express';
import { generateResources } from '../controllers/focusController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);
router.post('/focus/resources', generateResources);

export default router;