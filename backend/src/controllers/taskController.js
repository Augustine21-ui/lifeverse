import OpenAI from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import db from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// In-memory store for generated quizzes
if (!global.taskQuizStore) global.taskQuizStore = new Map();

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

    const prompt = `Generate a 5-question multiple-choice quiz on the topic: "${topic}". 
    Each question must have 4 options (A, B, C, D). Return ONLY valid JSON:
    {
      "questions": [
        { "question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": "A", "explanation": "..." }
      ]
    }`;

    const completion = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
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
    global.taskQuizStore.set(quizId, { ...quizData, taskId, topic });

    res.json({ quizId, questions: quizData.questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate quiz" });
  }
};

// Submit quiz and award XP, mark task completed
export const submitTaskQuiz = async (req, res) => {
  try {
    const { quizId, answers, userId } = req.body;
    const quizData = global.taskQuizStore.get(quizId);
    if (!quizData) return res.status(404).json({ error: 'Quiz expired or not found' });

    // Validate that the task exists
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
      // Update user XP and level
      await db.query(`UPDATE users SET xp = xp + $1 WHERE id = $2`, [xpEarned, userId]);
      await db.query(`UPDATE users SET level = FLOOR(xp / 500) + 1 WHERE id = $1`, [userId]);
      // Mark task as completed
      await db.query(`UPDATE tasks SET is_completed = TRUE, completed_at = NOW() WHERE id = $1`, [quizData.taskId]);
      message = `✅ Great! You scored ${percentage}% and earned ${xpEarned} XP!`;
    } else {
      message = `❌ You scored ${percentage}%. Need at least 50% to pass. Try a new quiz!`;
    }

    // Record attempt – now task_id is guaranteed valid
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
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Submission failed' });
  }
};