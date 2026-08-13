import express from 'express';
import {
  getMyStudyGroups,
  getStudyGroup,
  createStudyGroup,
  joinStudyGroup,
  logGroupFocus,
  shareResource,
} from '../controllers/studyGroupController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/study-groups/my', getMyStudyGroups);
router.get('/study-groups/:id', getStudyGroup);
router.post('/study-groups', createStudyGroup);
router.post('/study-groups/:id/join', joinStudyGroup);
router.post('/study-groups/:id/focus', logGroupFocus);
router.post('/study-groups/:id/resources', shareResource);

export default router;