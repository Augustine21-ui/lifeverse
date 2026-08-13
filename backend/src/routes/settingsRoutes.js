import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getSettings, updateSettings } from '../controllers/settingsController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getSettings);
router.put('/', updateSettings);

export default router;