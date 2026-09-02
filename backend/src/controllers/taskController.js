// backend/src/controllers/taskController.js
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import db from '../config/db.js';
import { 
  getAI, 
  isAIAvailableCheck, 
  generateMockResponse, 
  getModelForProvider,
  getAIProvider 
} from '../utils/aiUtils.js';
import { updateUserStreak } from '../utils/streakUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });

// In-memory store for generated quizzes
if (!global.taskQuizStore) global.taskQuizStore = new Map();

// Mock quiz generator
const generateMockQuiz = (topic) => {
  return {
    questions: [
      {
        question: `What is the main concept of ${topic}?`,
        options: ["Definition A", "Definition B", "Definition C", "Definition D"],
        correctAnswer: "A",
        explanation: `The main concept of ${topic} is best described by Definition A.`
      },
      {
        question: `Which of the following is most related to ${topic}?`,
        options: ["Related concept A", "Related concept B", "Related concept C", "Related concept D"],
        correctAnswer: "B",
        explanation: `Related concept B is most closely associated with ${topic}.`
      },
      {
        question: `How is ${topic} typically applied?`,
        options: ["Application A", "Application B", "Application C", "Application D"],
        correctAnswer: "C",
        explanation: `${topic} is commonly applied through Application C.`
      },
      {
        question: `What is a key benefit of understanding ${topic}?`,
        options: ["Benefit A", "Benefit B", "Benefit C", "Benefit D"],
        correctAnswer: "A",
        explanation: `Understanding ${topic} provides Benefit A as a key advantage.`
      },
      {
        question: `Which resource would best help you learn ${topic}?`,
        options: ["Resource A", "Resource B", "Resource C", "Resource D"],
        correctAnswer: "D",
        explanation: `Resource D is the most comprehensive resource for learning ${topic}.`
      }
    ]
  };
};

// Get today's tasks for a user
export const getTodaysTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT * FROM tasks WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE ORDER BY created_at`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

// Create a new task
export const createTask = async (req, res) => {
  try {
    const { title, xp_reward = 30 } = req.body;
    const userId = req.user.id;
    const result = await db.query(
      `INSERT INTO tasks (user_id, title, xp_reward) VALUES ($1, $2, $3) RETURNING *`,
      [userId, title, xp_reward]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create task" });
  }
};

// Delete a task
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await db.query(`DELETE FROM tasks WHERE id = $1 AND user_id = $2`, [id, userId]);
    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete task" });
  }
};

// Generate a quiz for a specific task (using AI)
export const generateTaskQuiz = async (req, res) => {
  try {
    const { taskId, topic } = req.body;
    if (!topic) return res.status(400).json({ error: "Topic required" });

    if (!isAIAvailableCheck()) {
      console.log('ℹ️ Using mock quiz for task:', taskId);
      const mockQuiz = generateMockQuiz(topic);
      const quizId = `task_${taskId}_mock_${Date.now()}`;
      global.taskQuizStore.set(quizId, { ...mockQuiz, taskId, topic, mock: true });
      return res.json({
        quizId,
        questions: mockQuiz.questions,
        mock: true,
        message: "AI is currently unavailable. Using mock quiz."
      });
    }

    const { openai, aiProvider } = getAI();
    const model = getModelForProvider(aiProvider);
    const prompt = `Generate a 5-question multiple-choice quiz on the topic: "${topic}". 
    Each question must have 4 options (A, B, C, D). Return ONLY valid JSON:
    {
      "questions": [
        { "question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": "A", "explanation": "..." }
      ]
    }`;

    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });

    let quizData;
    const text = completion.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) quizData = JSON.parse(jsonMatch[0]);
    else throw new Error("Invalid JSON");

    const quizId = `task_${taskId}_${Date.now()}`;
    global.taskQuizStore.set(quizId, { ...quizData, taskId, topic, mock: false });

    res.json({
      quizId,
      questions: quizData.questions,
      aiProvider,
      mock: false
    });
  } catch (err) {
    console.error('Quiz generation error:', err);
    const mockQuiz = generateMockQuiz(req.body.topic || 'general');
    const quizId = `task_${req.body.taskId || 'unknown'}_mock_${Date.now()}`;
    global.taskQuizStore.set(quizId, { ...mockQuiz, taskId: req.body.taskId, topic: req.body.topic, mock: true });
    res.json({
      quizId,
      questions: mockQuiz.questions,
      mock: true,
      message: "AI service unavailable. Using mock quiz."
    });
  }
};

// Submit quiz and award XP, mark task completed
export const submitTaskQuiz = async (req, res) => {
  try {
    const { quizId, answers, userId } = req.body;
    const quizData = global.taskQuizStore.get(quizId);
    if (!quizData) return res.status(404).json({ error: 'Quiz expired or not found' });

    const taskCheck = await db.query(`SELECT id, xp_reward FROM tasks WHERE id = $1`, [quizData.taskId]);
    if (taskCheck.rows.length === 0) {
      global.taskQuizStore.delete(quizId);
      return res.status(400).json({ error: 'Invalid task. Please try again.' });
    }
    const task = taskCheck.rows[0];

    let score = 0;
    const results = quizData.questions.map((q, idx) => {
      const isCorrect = q.correctAnswer === answers[idx];
      if (isCorrect) score++;
      return {
        question: q.question,
        userAnswer: answers[idx],
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const total = quizData.questions.length;
    const percentage = (score / total) * 100;
    const passed = percentage >= 50;

    let xpEarned = 0;
    let message = '';
    if (passed) {
      xpEarned = task.xp_reward || 30;
      await db.query(`UPDATE users SET xp = xp + $1 WHERE id = $2`, [xpEarned, userId]);
      await db.query(`UPDATE users SET level = FLOOR(xp / 500) + 1 WHERE id = $1`, [userId]);
      await db.query(`UPDATE tasks SET is_completed = TRUE, completed_at = NOW() WHERE id = $1`, [quizData.taskId]);
      message = `✅ Great! You scored ${percentage}% and earned ${xpEarned} XP!`;
    } else {
      message = `❌ You scored ${percentage}%. Need at least 50% to pass. Try a new quiz!`;
    }

    await db.query(
      `INSERT INTO task_quiz_attempts (task_id, user_id, score, total_questions, xp_earned, passed)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [quizData.taskId, userId, score, total, xpEarned, passed]
    );

    global.taskQuizStore.delete(quizId);

    res.json({
      passed,
      score,
      total,
      percentage,
      xpEarned,
      message,
      results,
      mock: quizData.mock || false
    });
  } catch (err) {
    console.error('Quiz submission error:', err);
    res.status(500).json({ error: 'Submission failed' });
  }
};

export const checkTaskAIStatus = async (req, res) => {
  res.json({
    aiAvailable: isAIAvailableCheck(),
    aiProvider: getAIProvider?.() || 'none',
    mockMode: !isAIAvailableCheck()
  });
};

export const completeTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const result = await db.query(
      `UPDATE tasks SET is_completed = TRUE, completed_at = NOW() 
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    const task = result.rows[0];
    await db.query(`UPDATE users SET xp = xp + $1 WHERE id = $2`, [task.xp_reward || 30, userId]);
    await db.query(`UPDATE users SET level = FLOOR(xp / 500) + 1 WHERE id = $1`, [userId]);
    await updateUserStreak(userId);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to complete task' });
  }
};