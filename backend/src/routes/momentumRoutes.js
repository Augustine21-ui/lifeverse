import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getCommunities,
  getCommunity,
  createCommunity,
  joinCommunity,
  leaveCommunity,
  getCommunityPosts,
  createPost,
  toggleLike,
  getComments,
  addComment,
  getCommunityEvents,
  rsvpEvent
} from '../controllers/momentumController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Communities
router.get('/communities', getCommunities);
router.get('/communities/:id', getCommunity);
router.post('/communities', createCommunity);
router.post('/communities/:id/join', joinCommunity);
router.delete('/communities/:id/leave', leaveCommunity);

// Posts
router.get('/communities/:id/posts', getCommunityPosts);
router.post('/posts', createPost);
router.post('/posts/:post_id/like', toggleLike);

// Comments
router.get('/posts/:post_id/comments', getComments);
router.post('/posts/:post_id/comments', addComment);

// Events
router.get('/communities/:id/events', getCommunityEvents);
router.post('/events/:event_id/rsvp', rsvpEvent);

export default router;