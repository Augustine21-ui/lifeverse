// backend/src/routes/index.js
import express from 'express';
import { register, login, getMe, authenticate } from '../auth.js';
import { getChallenges, submitChallenge, getUserChallenges } from '../challengeController.js';
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
import * as taskController from '../controllers/taskController.js';
import * as skillsController from '../controllers/skillsController.js';

const router = express.Router();

// Auth
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authenticate, getMe);

// Task completion – uses taskController (only updates is_completed)
router.put('/tasks/:id/complete', authenticate, taskController.completeTask);

// Dashboard
router.get('/dashboard/stats', authenticate, getDashboardStats);
router.get('/tasks', authenticate, getTodayTasks);
router.patch('/tasks/:id/complete', authenticate, taskController.completeTask);
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

// ===== SKILLS – TEMPORARILY DISABLED =====
// ❌ Commented out to fix deployment
router.get('/skills', authenticate, skillsController.getSkills);
router.get('/user-skills', authenticate, skillsController.getUserSkills);
router.put('/user-skills', authenticate, skillsController.updateUserSkill);
router.get('/skills-summary', authenticate, skillsController.getSkillsSummary);

// ===== BRIDGE ROUTES REMOVED =====
// All bridge routes are now handled by bridgeRoutes.js, mounted in the main index.js.

// Parent & Teacher (non-bridge)
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

// Additional peer contacts (already in bridge routes, but kept for compatibility)
router.get('/bridge/peer-contacts', authenticate, getPeerContacts);

// User communities (already in my-communities, kept for compatibility)
router.get('/user/communities', authenticate, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query('SELECT community_id FROM user_communities WHERE user_id = $1', [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bridge conversations alias (already in bridge routes)
router.get('/bridge/conversations', authenticate, getMessages);

export default router;