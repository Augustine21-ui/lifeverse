import OpenAI from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import db from '../config/db.js'; // adjust path to your DB connection

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// In-memory store for generated quizzes (replace with Redis/DB in production)
if (!global.quizStore) global.quizStore = new Map();

export const generateQuiz = async (req, res) => {
  try {
    const { topic, numQuestions = 5, difficulty = "medium" } = req.body;
    if (!topic) return res.status(400).json({ error: "Topic is required" });

    const prompt = `Generate a ${difficulty} difficulty quiz on the topic "${topic}" with exactly ${numQuestions} multiple-choice questions. 
    Return ONLY valid JSON in this format:
    {
      "questions": [
        {
          "question": "...",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "A",
          "explanation": "..."
        }
      ]
    }
    Do not include any extra text.`;

    const completion = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });

    let quizData;
    try {
      quizData = JSON.parse(completion.choices[0].message.content);
    } catch (e) {
      const text = completion.choices[0].message.content;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) quizData = JSON.parse(jsonMatch[0]);
      else throw new Error("Invalid response format");
    }

    const quizId = Date.now().toString();
    global.quizStore.set(quizId, { ...quizData, topic });
    res.json({ quizId, questions: quizData.questions });
  } catch (error) {
    console.error("Quiz generation error:", error);
    res.status(500).json({ error: "Failed to generate quiz" });
  }
};

export const submitQuiz = async (req, res) => {
  try {
    const { quizId, answers, userId } = req.body;
    if (!quizId || !answers) return res.status(400).json({ error: "Missing data" });

    const quizData = global.quizStore.get(quizId);
    if (!quizData) return res.status(404).json({ error: "Quiz not found or expired" });

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
    let xpEarned = 0;
    if (percentage >= 80) xpEarned = 100;
    else if (percentage >= 50) xpEarned = 50;
    else xpEarned = 20;

    if (userId) {
      await db.query('UPDATE users SET xp = xp + $1 WHERE id = $2', [xpEarned, userId]);
      await db.query(`UPDATE users SET level = FLOOR(xp / 500) + 1 WHERE id = $1`, [userId]);
      await db.query(
        `INSERT INTO quiz_attempts (user_id, topic, score, total_questions, xp_earned)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, quizData.topic, score, total, xpEarned]
      );
    }

    global.quizStore.delete(quizId);
    res.json({ score, total, xpEarned, results, message: `You earned ${xpEarned} XP!` });
  } catch (error) {
    console.error("Quiz submission error:", error);
    res.status(500).json({ error: "Failed to submit quiz" });
  }
};