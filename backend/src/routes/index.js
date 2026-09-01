// backend/src/routes/index.js
import express from 'express';
import { register, login, getMe, authenticate } from '../auth.js';
import { getChallenges, submitChallenge, getUserChallenges } from '../challengeController.js';
import { getChildren, getChildProgress } from '../parentController.js';
import { getStudents, getStudentProgressForTeacher, getClassSummary } from '../teacherController.js';
import { sendMessage, getMessages, getMessagesByConversation, getPeerContacts, getOrCreatePeerConversation } from '../bridgeMessageController.js';
import * as timetableController from '../controllers/timetableController.js';
import * as libraryController from '../controllers/libraryController.js';
import { getResources } from '../resourcesController.js';
import * as opportunityController from '../controllers/opportunityController.js';
import { getOpportunities, applyOpportunity, getUserApplications } from '../opportunityController.js';
import { getBadges, getUserBadges } from '../controllers/badgesController.js';
import { getGoals, createGoal, updateGoal, deleteGoal, toggleMilestone } from '../controllers/goalsController.js';
import { createPost, getPosts, likePost, getComments, addComment, deletePost } from '../feedController.js';
import { getDashboardStats, getTodayTasks, completeTask, completeFocusSession, getFocusRemaining, getTodayChallenges, createTask, deleteTask } from '../dashboardController.js';
import { recordMood } from '../moodController.js';
import * as skillGrowth from '../controllers/skillGrowthController.js';
import * as taskController from '../controllers/taskController.js';
import * as skillsController from '../controllers/skillsController.js';
import * as goalsController from '../controllers/goalsController.js';
import * as studyController from '../controllers/studyController.js';
import { googleAuth } from '../controllers/authController.js';
import { 
  register, login, getMe, forgotPassword, resetPassword,
  verifyEmail, resendVerificationCode  // new
} from '../controllers/authController.js';

// ─── AI CONTROLLER (all AI functions) ──────────────────────────
import { 
  explain,
  tutorChat, 
  generateQuiz, 
  generateOrbitContent, 
  getPersonalizedRecommendations 
} from '../controllers/aiController.js';

// ─── MOMENTUM CONTROLLER (communities, events, etc.) ──────────
import { 
  getCommunities, 
  getCommunity, 
  createCommunity, 
  joinCommunity, 
  leaveCommunity, 
  getCommunityPosts, 
  createPost as createCommunityPost,
  toggleLike, 
  getComments as getPostComments, 
  addComment as addPostComment, 
  getCommunityEvents, 
  rsvpEvent,
  getNotifications   // ✅ added export
} from '../controllers/momentumController.js';

const router = express.Router();

// =============================================================
//  AUTH
// =============================================================
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authenticate, getMe);
router.post('/auth/google', googleAuth);

// =============================================================
//  DASHBOARD & TASKS
// =============================================================
router.get('/dashboard/stats', authenticate, getDashboardStats);
router.get('/tasks', authenticate, getTodayTasks);
router.patch('/tasks/:id/complete', authenticate, taskController.completeTask);
router.put('/tasks/:id/complete', authenticate, taskController.completeTask);
router.post('/focus/session', authenticate, completeFocusSession);
router.get('/focus/remaining', authenticate, getFocusRemaining);
router.get('/today-challenges', authenticate, getTodayChallenges);
router.post('/mood', authenticate, recordMood);
router.post('/tasks', authenticate, createTask);
router.delete('/tasks/:id', authenticate, deleteTask);

// =============================================================
//  CHALLENGES
// =============================================================
router.get('/challenges', authenticate, getChallenges);
router.post('/challenges/submit', authenticate, submitChallenge);
router.get('/my-challenges', authenticate, getUserChallenges);

// =============================================================
//  OPPORTUNITIES
// =============================================================
router.get('/opportunities/personalized', authenticate, opportunityController.getPersonalized);
router.get('/opportunities', authenticate, opportunityController.getOpportunities);
router.get('/opportunities/:id', authenticate, opportunityController.getOpportunity);
router.post('/opportunities/:id/apply', authenticate, opportunityController.applyOpportunity);
router.get('/my-applications', authenticate, opportunityController.getMyApplications);
router.get('/organizations/:id', authenticate, opportunityController.getOrganization);

// =============================================================
//  FEED (global)
// =============================================================
router.post('/feed/posts', authenticate, createPost);
router.get('/feed/posts', authenticate, getPosts);
router.post('/feed/posts/:id/like', authenticate, likePost);
router.get('/feed/posts/:id/comments', authenticate, getComments);
router.post('/feed/posts/:id/comments', authenticate, addComment);
router.delete('/feed/posts/:id', authenticate, deletePost);
 

// Add routes
router.post('/auth/verify-email', verifyEmail);
router.post('/auth/resend-verification', resendVerificationCode);
// =============================================================
//  AI ROUTES  🧠
// =============================================================
router.post('/ai/explain', authenticate, explain);
router.post('/ai/tutor', authenticate, tutorChat);
router.post('/ai/quiz', authenticate, generateQuiz);
router.post('/ai/orbit/generate', authenticate, generateOrbitContent);
router.get('/ai/recommendations', authenticate, getPersonalizedRecommendations);

// =============================================================
//  MOMENTUM – Communities
// =============================================================
router.get('/communities', authenticate, getCommunities);
router.get('/communities/:id', authenticate, getCommunity);
router.post('/communities', authenticate, createCommunity);
router.post('/communities/:id/join', authenticate, joinCommunity);
router.delete('/communities/:id/leave', authenticate, leaveCommunity);
router.get('/communities/:id/posts', authenticate, getCommunityPosts);
router.post('/posts', authenticate, createCommunityPost);
router.post('/posts/:post_id/like', authenticate, toggleLike);
router.get('/posts/:post_id/comments', authenticate, getPostComments);
router.post('/posts/:post_id/comments', authenticate, addPostComment);
router.get('/communities/:communityId/events', authenticate, getCommunityEvents);
router.post('/events/:eventId/rsvp', authenticate, rsvpEvent);

// =============================================================
//  BADGES
// =============================================================
router.get('/badges', authenticate, getBadges);
router.get('/my-badges', authenticate, getUserBadges);

// =============================================================
//  GOALS
// =============================================================
router.get('/goals', authenticate, getGoals);
router.post('/goals', authenticate, createGoal);
router.put('/goals/:id', authenticate, updateGoal);
router.delete('/goals/:id', authenticate, deleteGoal);
router.patch('/goals/:id/milestones/:milestoneId/toggle', authenticate, toggleMilestone);
router.get('/goals/:id/actions', authenticate, goalsController.getGoalActions);
router.post('/goals/:id/complete', authenticate, goalsController.completeGoal);

// =============================================================
//  SKILLS
// =============================================================
router.get('/skills', authenticate, skillsController.getSkills);
router.get('/user-skills', authenticate, skillsController.getUserSkills);
router.put('/user-skills', authenticate, skillsController.updateUserSkill);
router.get('/skills-summary', authenticate, skillsController.getSkillsSummary);

// =============================================================
//  SKILL GROWTH
// =============================================================
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

// =============================================================
//  TIMETABLE
// =============================================================
router.get('/timetable/my', authenticate, timetableController.getMyTimetable);
router.get('/timetable/my/day/:date', authenticate, timetableController.getMyDay);
router.get('/timetable/my/week/:startDate', authenticate, timetableController.getMyWeek);
router.get('/timetable/my/month/:year/:month', authenticate, timetableController.getMyMonth);

// Institution timetable
router.get('/institution/timetable', authenticate, timetableController.getInstitutionTimetable);
router.post('/institution/timetable', authenticate, timetableController.createTimetableEntry);
router.put('/institution/timetable/:id', authenticate, timetableController.updateTimetableEntry);
router.delete('/institution/timetable/:id', authenticate, timetableController.deleteTimetableEntry);
router.get('/institution/rooms', authenticate, timetableController.getRooms);
router.post('/institution/rooms', authenticate, timetableController.createRoom);
router.get('/institution/courses', authenticate, timetableController.getCourses);
router.post('/institution/courses', authenticate, timetableController.createCourse);

// =============================================================
//  STUDY
// =============================================================
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

// =============================================================
//  LIBRARY
// =============================================================
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

// =============================================================
//  PARENT & TEACHER
// =============================================================
router.get('/parent/children', authenticate, getChildren);
router.get('/parent/child/:id/progress', authenticate, getChildProgress);
router.get('/teacher/students', authenticate, getStudents);
router.get('/teacher/student/:id/progress', authenticate, getStudentProgressForTeacher);
router.get('/teacher/class-summary', authenticate, getClassSummary);

// =============================================================
//  BRIDGE (messaging)
// =============================================================
router.get('/bridge/peer-contacts', authenticate, getPeerContacts);
router.get('/bridge/conversations', authenticate, getMessages);
router.post('/bridge/messages', authenticate, sendMessage);
router.get('/bridge/messages/:conversationId', authenticate, getMessagesByConversation);
router.get('/bridge/messages/conversation/:userId', authenticate, getOrCreatePeerConversation);

// =============================================================
//  RESOURCES
// =============================================================
router.get('/resources', authenticate, getResources);

// =============================================================
//  NOTIFICATIONS
// =============================================================
router.get('/notifications', authenticate, getNotifications);

// =============================================================
//  ROOT
// =============================================================
router.get('/', (req, res) => res.json({ message: 'API root' }));

export default router;