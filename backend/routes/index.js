import express from 'express';
import { register, login, getMe, authenticate } from '../auth.js';
import { getChallenges, submitChallenge, getUserChallenges } from '../challengeController.js';
import * as bridge from '../bridgeController.js';
import { getChildren, getChildProgress } from '../parentController.js';
import { getStudents, getStudentProgressForTeacher, getClassSummary } from '../teacherController.js';
import { sendMessage, getMessages, getMessagesByConversation } from '../bridgeMessageController.js';
import { getResources } from '../resourcesController.js';
import { getOpportunities, applyOpportunity, getUserApplications } from '../opportunityController.js';
import { getCommunities, getCommunityById, joinCommunity, createCommunity } from '../communityController.js';
import { getBadges, getUserBadges } from '../badgesController.js';
import { getGoals, createGoal, updateGoal, deleteGoal, toggleMilestone } from '../goalsController.js';
import { createPost, getPosts, likePost, getComments, addComment, deletePost } from '../feedController.js';
import { getDashboardStats, getTodayTasks, completeTask, completeFocusSession, getFocusRemaining, getTodayChallenges } from '../dashboardController.js';
import { recordMood } from '../moodController.js'
import { forgotPassword, resetPassword } from '../passwordController.js';

const router = express.Router();

// ==================== AUTH ====================
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authenticate, getMe);

// ==================== DASHBOARD & STATS ====================
router.get('/dashboard/stats', authenticate, getDashboardStats);
router.get('/tasks', authenticate, getTodayTasks);
router.patch('/tasks/:id/complete', authenticate, completeTask);
router.post('/focus/session', authenticate, completeFocusSession);
router.get('/focus/remaining', authenticate, getFocusRemaining);
router.get('/today-challenges', authenticate, getTodayChallenges);
router.post('/mood', authenticate, recordMood);

// ==================== CHALLENGES ====================
router.get('/challenges', authenticate, getChallenges);
router.post('/challenges/submit', authenticate, submitChallenge);
router.get('/my-challenges', authenticate, getUserChallenges);

// ==================== OPPORTUNITIES ====================
router.get('/opportunities', authenticate, getOpportunities);
router.post('/opportunities/apply', authenticate, applyOpportunity);
router.get('/my-applications', authenticate, getUserApplications);

// ==================== FEED ====================
router.post('/feed/posts', authenticate, createPost);
router.get('/feed/posts', authenticate, getPosts);
router.post('/feed/posts/:id/like', authenticate, likePost);
router.get('/feed/posts/:id/comments', authenticate, getComments);
router.post('/feed/posts/:id/comments', authenticate, addComment);
router.delete('/feed/posts/:id', authenticate, deletePost);

// ==================== COMMUNITIES ====================
router.get('/communities', authenticate, getCommunities);
router.get('/communities/:id', authenticate, getCommunityById);
router.post('/communities/:id/join', authenticate, joinCommunity);

// ==================== BADGES ====================
router.get('/badges', authenticate, getBadges);
router.get('/my-badges', authenticate, getUserBadges);

// ==================== GOALS ====================
router.get('/goals', authenticate, getGoals);
router.post('/goals', authenticate, createGoal);
router.put('/goals/:id', authenticate, updateGoal);
router.delete('/goals/:id', authenticate, deleteGoal);
router.patch('/goals/:id/milestones/:milestoneId/toggle', authenticate, toggleMilestone);

// ==================== BRIDGE ====================
router.get('/bridge/generate-code', authenticate, bridge.generateConnectionCode);
router.post('/bridge/connect', authenticate, bridge.linkStudent);
router.get('/bridge/my-students', authenticate, bridge.getTeacherStudents);
router.get('/bridge/my-child', authenticate, bridge.getParentChild);
router.get('/bridge/student/:id/progress', authenticate, bridge.getStudentProgressById);
router.get('/bridge/announcements', authenticate, bridge.getAnnouncements);
router.post('/bridge/announcements', authenticate, bridge.createAnnouncement);
router.post('/bridge/messages', authenticate, sendMessage);
router.get('/bridge/messages', authenticate, getMessages);
router.get('/bridge/messages/:conversationId', authenticate, getMessagesByConversation);

// ==================== PARENT & TEACHER DASHBOARDS ====================
router.get('/parent/children', authenticate, getChildren);
router.get('/parent/child/:id/progress', authenticate, getChildProgress);
router.get('/teacher/students', authenticate, getStudents);
router.get('/teacher/student/:id/progress', authenticate, getStudentProgressForTeacher);
router.get('/teacher/class-summary', authenticate, getClassSummary);

// ==================== STUDYSPHERE ====================
router.get('/resources', authenticate, getResources);

router.post('/communities', authenticate, createCommunity);

router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);


// ==================== ROOT ====================
router.get('/', (req, res) => res.json({ message: 'API is working' }));

export default router;