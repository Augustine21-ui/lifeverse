import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  // Original
  getStudentProgress,
  getTeacherStudents,
  generateConnectionCode,
  linkStudent,
  getParentChild,
  getStudentProgressById,
  getAnnouncements,
  createAnnouncement,
  // New
  getPrivacySettings,
  updatePrivacySettings,
  uploadReportCard,
  createAssignment,
  giveFeedback,
  createSupportRequest,
  createReflection,
  sendEncouragement,
  getEncouragementWall,
  getParentChildProgress,
  getNotifications,
  markNotificationRead,
} from '../controllers/bridgeController.js';
import {
  sendMessage,
  getMessages,
  getMessagesByConversation,
  getPeerContacts,
  getOrCreatePeerConversation,
} from '../bridgeMessageController.js';

const router = express.Router();

// All bridge routes require authentication (NOT admin)
router.use(authenticate);

// --- Student progress ---
router.get('/bridge/my-progress', getStudentProgress);
router.get('/bridge/student/:id/progress', getStudentProgressById);

// --- Teacher ---
router.get('/bridge/my-students', getTeacherStudents);

// --- Linking ---
router.get('/bridge/generate-code', generateConnectionCode);
router.post('/bridge/link-student', linkStudent);
router.get('/bridge/my-child', getParentChild);
router.post('/bridge/connect', linkStudent);  // alias

// --- Announcements ---
router.get('/bridge/announcements', getAnnouncements);
router.post('/bridge/announcements', createAnnouncement);

// --- Messaging (Bridge conversations) ---
router.get('/bridge/conversations', getMessages);
router.get('/bridge/messages', getMessages);
router.get('/bridge/messages/:conversationId', getMessagesByConversation);
router.post('/bridge/messages', sendMessage);
router.get('/bridge/peer-contacts', getPeerContacts);
router.get('/bridge/conversation/with/:userId', getOrCreatePeerConversation);

// --- Privacy ---
router.get('/bridge/privacy', getPrivacySettings);
router.put('/bridge/privacy', updatePrivacySettings);

// --- Teacher actions ---
router.post('/bridge/report-card', uploadReportCard);
router.post('/bridge/assignment', createAssignment);
router.post('/bridge/feedback', giveFeedback);

// --- Student actions ---
router.post('/bridge/support-request', createSupportRequest);
router.post('/bridge/reflection', createReflection);
router.post('/bridge/encouragement', sendEncouragement);
router.get('/bridge/encouragement/:studentId', getEncouragementWall);

// --- Parent dashboard ---
router.get('/bridge/parent-child-progress', getParentChildProgress);

// --- Notifications ---
router.get('/bridge/notifications', getNotifications);
router.put('/bridge/notifications/:id/read', markNotificationRead);

export default router;