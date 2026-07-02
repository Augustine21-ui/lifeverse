import express from 'express';
import { generatePersonalization, getRecommendations, actOnRecommendation } from '../controllers/personalizationController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

router.post('/personalize/generate', generatePersonalization);
router.get('/personalize/recommendations', getRecommendations);
router.put('/personalize/recommendations/:id/act', actOnRecommendation);

export default router;