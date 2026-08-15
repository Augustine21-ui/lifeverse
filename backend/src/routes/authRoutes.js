import express from 'express';
import { register, login, forgotPassword, resetPassword, getMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { googleAuth } from '../controllers/googleAuthController.js';

const router = express.Router();

// ✅ PUBLIC ROUTES (no authentication) – MUST come first
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);
router.post('/google', googleAuth); // Google OAuth is also public

// ❌ PROTECTED ROUTES (require authentication) – come AFTER
router.use(authenticate);
router.get('/auth/me', getMe);

export default router;