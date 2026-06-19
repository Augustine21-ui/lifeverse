import express from 'express';
import { generateQuiz, submitQuiz } from '../controllers/quizController.js';

const router = express.Router();

router.post('/quiz/generate', generateQuiz);
router.post('/quiz/submit', submitQuiz);

export default router;