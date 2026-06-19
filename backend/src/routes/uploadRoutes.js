import express from 'express';
import { uploadFile, uploadSingle } from '../controllers/uploadController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/upload', authenticate, uploadSingle, uploadFile);

export default router;