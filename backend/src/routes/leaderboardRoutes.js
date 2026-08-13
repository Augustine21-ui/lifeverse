import express from 'express';
import { getLeaderboard } from '../controllers/leaderboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.get('/leaderboard', authenticate, getLeaderboard);

export default router;