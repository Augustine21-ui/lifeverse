import express from 'express';
import { register, login, forgotPassword, resetPassword, getMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { googleAuth } from '../controllers/googleAuthController.js';

const router = express.Router();

// ✅ PUBLIC ROUTES (no authentication) – no '/auth' prefix
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/google', googleAuth);

// ✅ PROTECTED ROUTES
router.use(authenticate);
router.get('/me', getMe);

export default router;