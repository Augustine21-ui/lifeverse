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

// Overview
router.get('/admin/stats', getStats);
router.get('/admin/performance', getPerformance);
router.get('/admin/health', getSystemHealth);

// Users
router.get('/admin/users', getUsers);
router.put('/admin/users/:id', updateUser);
router.delete('/admin/users/:id', deleteUser);

// Subscriptions
router.get('/admin/subscriptions', getSubscriptions);
router.put('/admin/subscriptions/:id', updateSubscription);
router.post('/admin/subscriptions', createSubscription);

// Announcements
router.get('/admin/announcements', getAnnouncements);
router.post('/admin/announcements', createAnnouncement);

export default router;