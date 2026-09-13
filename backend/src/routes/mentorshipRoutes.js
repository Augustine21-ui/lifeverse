// backend/src/routes/mentorshipRoutes.js
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  listMentors,
  requestMentorship,
  acceptMentorship,
  getMyMentorships,
  registerAsMentor,
} from '../controllers/mentorshipController.js';

const router = express.Router();
router.use(authenticate);

router.get('/mentors', listMentors);
router.post('/mentors/register', registerAsMentor);
router.post('/request', requestMentorship);
router.post('/:id/accept', acceptMentorship);
router.get('/my', getMyMentorships);

export default router;