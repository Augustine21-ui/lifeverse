// backend/src/routes/index.js
// backend/src/routes/index.js
import express from 'express';
import { register, login, getMe, authenticate } from '../auth.js';
import { getChallenges, submitChallenge, getUserChallenges } from '../challengeController.js';
import { getChildren, getChildProgress } from '../parentController.js';
import { getStudents, getStudentProgressForTeacher, getClassSummary } from '../teacherController.js';
import { sendMessage, getMessages, getMessagesByConversation, getPeerContacts, getOrCreatePeerConversation } from '../bridgeMessageController.js';
import * as timetableController from '../controllers/timetableController.js';
import * as libraryController from '../controllers/libraryController.js';
// ✅ resourcesController is in src/
import { getResources } from '../resourcesController.js';
import * as opportunityController from '../controllers/opportunityController.js';

import { getOpportunities, applyOpportunity, getUserApplications } from '../opportunityController.js';
import { getCommunities, getCommunityById, joinCommunity, leaveCommunity, getMyCommunities, getCommunityMessages, sendCommunityMessage, getCommunityMembers, updateMemberRole, createCommunity } from '../communityController.js';

// ✅ badgesController and goalsController are in src/controllers/
import { getBadges, getUserBadges } from '../controllers/badgesController.js';
import { getGoals, createGoal, updateGoal, deleteGoal, toggleMilestone } from '../controllers/goalsController.js';

import { createPost, getPosts, likePost, getComments, addComment, deletePost } from '../feedController.js';
import { getDashboardStats, getTodayTasks, completeTask, completeFocusSession, getFocusRemaining, getTodayChallenges, createTask, deleteTask } from '../dashboardController.js';
import { recordMood } from '../moodController.js';
import * as skillGrowth from '../controllers/skillGrowthController.js';
// ✅ taskController and skillsController are in src/controllers/
import * as taskController from '../controllers/taskController.js';
import * as skillsController from '../controllers/skillsController.js';
import * as goalsController from '../controllers/goalsController.js';
import * as studyController from '../controllers/studyController.js';
import { googleAuth } from '../controllers/authController.js';


// ... rest of file unchanged

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
router.get('/goals/:id/actions', authenticate, goalsController.getGoalActions);  // New
router.post('/goals/:id/complete', authenticate, goalsController.completeGoal);

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

// Google OAuth
router.post('/auth/google', googleAuth);

// StudySphere
router.get('/resources', authenticate, getResources);

// Community chat routes
router.get('/communities/:id/members', authenticate, getCommunityMembers);
router.get('/communities/:id/messages', authenticate, getCommunityMessages);
router.post('/communities/:id/messages', authenticate, sendCommunityMessage);
router.patch('/communities/:id/members/role', authenticate, updateMemberRole);

// ─── Skill Growth Routes ───
router.get('/skills/:skillId/progress', authenticate, skillGrowth.getSkillProgress);
router.get('/skills/:skillId/projects', authenticate, skillGrowth.getProjects);
router.post('/projects/assign', authenticate, skillGrowth.assignProject);
router.put('/project-assignments/:assignmentId', authenticate, skillGrowth.updateProjectContribution);
router.get('/skills/:skillId/my-projects', authenticate, skillGrowth.getUserProjects);
router.get('/skills/:skillId/challenges', authenticate, skillGrowth.getChallenges);
router.post('/challenges/submit', authenticate, skillGrowth.submitChallenge);
router.get('/skills/:skillId/my-challenges', authenticate, skillGrowth.getUserChallengeSubmissions);
router.get('/skills/:skillId/practice', authenticate, skillGrowth.getPracticeActivities);
router.post('/practice/submit', authenticate, skillGrowth.submitPracticeResult);
router.get('/skills/:skillId/my-practice', authenticate, skillGrowth.getUserPracticeResults);
router.get('/skills/:skillId/recommendations', authenticate, skillGrowth.getRecommendations);
router.post('/skills/create', authenticate, skillGrowth.createSkill);

router.get('/timetable/my', authenticate, timetableController.getMyTimetable);
router.get('/timetable/my/day/:date', authenticate, timetableController.getMyDay);
router.get('/timetable/my/week/:startDate', authenticate, timetableController.getMyWeek);
router.get('/timetable/my/month/:year/:month', authenticate, timetableController.getMyMonth);

// Institution management
router.get('/institution/timetable', authenticate, timetableController.getInstitutionTimetable);
router.post('/institution/timetable', authenticate, timetableController.createTimetableEntry);
router.put('/institution/timetable/:id', authenticate, timetableController.updateTimetableEntry);
router.delete('/institution/timetable/:id', authenticate, timetableController.deleteTimetableEntry);
router.get('/institution/rooms', authenticate, timetableController.getRooms);
router.post('/institution/rooms', authenticate, timetableController.createRoom);
router.get('/institution/courses', authenticate, timetableController.getCourses);
router.post('/institution/courses', authenticate, timetableController.createCourse);

router.get('/study/notes', authenticate, studyController.getNotes);
router.post('/study/notes', authenticate, studyController.createNote);
router.put('/study/notes/:id', authenticate, studyController.updateNote);
router.delete('/study/notes/:id', authenticate, studyController.deleteNote);
router.patch('/study/notes/:id/pin', authenticate, studyController.pinNote);

router.get('/study/highlights', authenticate, studyController.getHighlights);
router.post('/study/highlights', authenticate, studyController.createHighlight);

router.get('/study/bookmarks', authenticate, studyController.getBookmarks);
router.post('/study/bookmarks', authenticate, studyController.createBookmark);
router.delete('/study/bookmarks/:id', authenticate, studyController.deleteBookmark);

router.get('/opportunities/personalized', authenticate, opportunityController.getPersonalized);
router.get('/opportunities', authenticate, opportunityController.getOpportunities);
router.get('/opportunities/:id', authenticate, opportunityController.getOpportunity);
router.post('/opportunities/:id/apply', authenticate, opportunityController.applyOpportunity);
router.get('/my-applications', authenticate, opportunityController.getMyApplications);
router.get('/organizations/:id', authenticate, opportunityController.getOrganization);


router.get('/library/categories', authenticate, libraryController.getCategories);
router.post('/library/categories', authenticate, libraryController.createCategory);
router.delete('/library/categories/:id', authenticate, libraryController.deleteCategory);

router.get('/library/books', authenticate, libraryController.getBooks);
router.get('/library/books/:id', authenticate, libraryController.getBook);
router.post('/library/books', authenticate, libraryController.createBook);
router.put('/library/books/:id', authenticate, libraryController.updateBook);
router.delete('/library/books/:id', authenticate, libraryController.deleteBook);

router.get('/library/continue', authenticate, libraryController.getContinueReading);
router.put('/library/books/:id/progress', authenticate, libraryController.updateProgress);
router.get('/library/books/:id/progress', authenticate, libraryController.getProgress);

router.get('/library/books/:id/bookmarks', authenticate, libraryController.getBookmarks);
router.post('/library/books/:id/bookmarks', authenticate, libraryController.createBookmark);
router.delete('/library/books/:id/bookmarks/:bookmarkId', authenticate, libraryController.deleteBookmark);

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