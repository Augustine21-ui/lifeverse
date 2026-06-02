import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getMe, updateProfile } from '../controllers/authController.js';
import { getGoals, createGoal, updateGoal, deleteGoal, toggleMilestone } from '../controllers/goalsController.js';
import { getCommunities, joinCommunity, leaveCommunity, getPosts, createPost, likePost } from '../controllers/communityController.js';
import { getDashboard, getBadges, getLeaderboard } from '../controllers/dashboardController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Auth
router.post('/auth/register', [
  body('username').trim().isLength({ min: 3, max: 50 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
], register);

router.post('/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], login);

router.get('/auth/me', authenticate, getMe);
router.patch('/auth/profile', authenticate, updateProfile);

// Dashboard
router.get('/dashboard', authenticate, getDashboard);
router.get('/badges', authenticate, getBadges);
router.get('/leaderboard', getLeaderboard);

// Goals
router.get('/goals', authenticate, getGoals);
router.post('/goals', authenticate, createGoal);
router.patch('/goals/:id', authenticate, updateGoal);
router.delete('/goals/:id', authenticate, deleteGoal);
router.patch('/milestones/:id/toggle', authenticate, toggleMilestone);

// Communities
router.get('/communities', optionalAuth, getCommunities);
router.post('/communities/:id/join', authenticate, joinCommunity);
router.delete('/communities/:id/leave', authenticate, leaveCommunity);
router.get('/communities/:id/posts', optionalAuth, getPosts);
router.post('/communities/:id/posts', authenticate, createPost);
router.post('/posts/:postId/like', authenticate, likePost);

export default router;