import express from 'express';
import { register, login, forgotPassword, resetPassword, getMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no authentication)
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);

// Protected routes (require authentication)
router.use(authenticate);
router.get('/auth/me', getMe);

export default router;