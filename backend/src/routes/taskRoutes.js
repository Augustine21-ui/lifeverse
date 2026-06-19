import express from 'express';
import { 
  getTodaysTasks, 
  createTask, 
  deleteTask, 
  generateTaskQuiz, 
  submitTaskQuiz 
} from '../controllers/taskController.js';
import { authenticate } from '../middleware/auth.js'; // adjust if your auth middleware is named differently

const router = express.Router();

// Apply authentication to all task routes
router.use(authenticate);

router.get('/tasks/today', getTodaysTasks);
router.post('/tasks', createTask);
router.delete('/tasks/:id', deleteTask);
router.post('/tasks/quiz/generate', generateTaskQuiz);
router.post('/tasks/quiz/submit', submitTaskQuiz);

export default router;