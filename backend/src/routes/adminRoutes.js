import express from 'express';
import {
  getStats,
  getUsers,
  updateUser,
  deleteUser,
  getSubscriptions,
  updateSubscription,
  createSubscription,
  getPerformance,
  getAnnouncements,
  createAnnouncement,
  getSystemHealth,
} from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// No "/admin" prefix – mount point handles it
router.get('/stats', getStats);
router.get('/performance', getPerformance);
router.get('/health', getSystemHealth);

router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.get('/subscriptions', getSubscriptions);
router.put('/subscriptions/:id', updateSubscription);
router.post('/subscriptions', createSubscription);

router.get('/announcements', getAnnouncements);
router.post('/announcements', createAnnouncement);

export default router;