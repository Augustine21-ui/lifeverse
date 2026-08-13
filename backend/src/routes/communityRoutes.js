import express from 'express';
import {
  createGroup,
  getGroups,
  joinGroup,
  getGroupPosts,
  createGroupPost,
  createBoardTopic,
  getBoardTopics,
  replyToTopic,
  voteTopic,
} from '../controllers/communityController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// Groups
router.post('/groups', createGroup);
router.get('/groups', getGroups);
router.post('/groups/:id/join', joinGroup);
router.get('/groups/:id/posts', getGroupPosts);
router.post('/groups/:id/posts', createGroupPost);

// Boards
router.get('/boards/:boardId/topics', getBoardTopics);
router.post('/boards/topics', createBoardTopic);
router.post('/boards/topics/:id/reply', replyToTopic);
router.post('/boards/topics/:id/vote', voteTopic);

export default router;