import express from 'express';
import { register, login, getMe, authenticate } from '../auth.js';
import { getChallenges, submitChallenge, getUserChallenges } from '../challengeController.js';
import * as bridge from '../bridgeController.js';
import { getChildren, getChildProgress } from '../parentController.js';
import { getStudents, getStudentProgressForTeacher, getClassSummary } from '../teacherController.js';
import { sendMessage, getMessages, getMessagesByConversation, getPeerContacts, getOrCreatePeerConversation } from '../bridgeMessageController.js';
import { getResources } from '../resourcesController.js';
import { getOpportunities, applyOpportunity, getUserApplications } from '../opportunityController.js';
import { getCommunities, getCommunityById, joinCommunity, leaveCommunity, getMyCommunities, getCommunityMessages, sendCommunityMessage, getCommunityMembers, updateMemberRole, createCommunity } from '../communityController.js';
import { getBadges, getUserBadges } from '../badgesController.js';
import { getGoals, createGoal, updateGoal, deleteGoal, toggleMilestone } from '../goalsController.js';
import { createPost, getPosts, likePost, getComments, addComment, deletePost } from '../feedController.js';
import { getDashboardStats, getTodayTasks, completeTask, completeFocusSession, getFocusRemaining, getTodayChallenges, createTask, deleteTask } from '../dashboardController.js';
import { recordMood } from '../moodController.js';

const router = express.Router();

// Auth
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authenticate, getMe);

// Dashboard
router.get('/dashboard/stats', authenticate, getDashboardStats);
router.get('/tasks', authenticate, getTodayTasks);
router.patch('/tasks/:id/complete', authenticate, completeTask);
router.post('/focus/session', authenticate, completeFocusSession);
router.get('/focus/remaining', authenticate, getFocusRemaining);
router.get('/today-challenges', authenticate, getTodayChallenges);
router.post('/mood', authenticate, recordMood);
router.post('/tasks', authenticate, createTask);
router.delete('/tasks/:id', authenticate, deleteTask);

// Challenges
router.get('/challenges', authenticate, getChallenges);
router.post('/challenges/submit', authenticate, submitChallenge);
router.get('/my-challenges', authenticate, getUserChallenges);

// Opportunities
router.get('/opportunities', authenticate, getOpportunities);
router.post('/opportunities/apply', authenticate, applyOpportunity);
router.get('/my-applications', authenticate, getUserApplications);

// Feed
router.post('/feed/posts', authenticate, createPost);
router.get('/feed/posts', authenticate, getPosts);
router.post('/feed/posts/:id/like', authenticate, likePost);
router.get('/feed/posts/:id/comments', authenticate, getComments);
router.post('/feed/posts/:id/comments', authenticate, addComment);
router.delete('/feed/posts/:id', authenticate, deletePost);

// Communities
router.get('/communities', authenticate, getCommunities);
router.get('/communities/:id', authenticate, getCommunityById);
router.post('/communities/:id/join', authenticate, joinCommunity);
router.post('/communities', authenticate, createCommunity); 
router.post('/communities/:id/join', authenticate, joinCommunity);
router.delete('/communities/:id/leave', authenticate, leaveCommunity);
router.get('/my-communities', authenticate, getMyCommunities);

// Badges
router.get('/badges', authenticate, getBadges);
router.get('/my-badges', authenticate, getUserBadges);

// Goals
router.get('/goals', authenticate, getGoals);
router.post('/goals', authenticate, createGoal);
router.put('/goals/:id', authenticate, updateGoal);
router.delete('/goals/:id', authenticate, deleteGoal);
router.patch('/goals/:id/milestones/:milestoneId/toggle', authenticate, toggleMilestone);

// Bridge
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
router.get('/bridge/conversation/with/:userId', authenticate, getOrCreatePeerConversation);
// Parent & Teacher
router.get('/parent/children', authenticate, getChildren);
router.get('/parent/child/:id/progress', authenticate, getChildProgress);
router.get('/teacher/students', authenticate, getStudents);
router.get('/teacher/student/:id/progress', authenticate, getStudentProgressForTeacher);
router.get('/teacher/class-summary', authenticate, getClassSummary);

// StudySphere
router.get('/resources', authenticate, getResources);

// Community chat routes
router.get('/communities/:id/members', authenticate, getCommunityMembers);

router.get('/communities/:id/messages', authenticate, getCommunityMessages);
router.post('/communities/:id/messages', authenticate, sendCommunityMessage);
router.patch('/communities/:id/members/role', authenticate, updateMemberRole);


// Root
router.get('/', (req, res) => res.json({ message: 'API root' }));

router.get('/bridge/peer-contacts', authenticate, getPeerContacts);

router.get('/user/communities', authenticate, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query('SELECT community_id FROM user_communities WHERE user_id = $1', [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

// Bridge conversations (alias for /bridge/messages)
router.get('/bridge/conversations', authenticate, getMessages);
