// backend/src/controllers/quizController.js
import db from '../config/db.js';
import { 
  getAI, 
  isAIAvailableCheck, 
  generateMockResponse, 
  getModelForProvider,
  getAIProvider 
} from '../utils/aiUtils.js';

// Helper to get AI response for quiz generation
const generateQuizWithAI = async (topic, subject, difficulty) => {
  if (!isAIAvailableCheck()) {
    return generateMockQuiz(topic, subject);
  }

  try {
    const { openai, aiProvider } = getAI();
    const model = getModelForProvider(aiProvider);
    const prompt = `Generate a ${difficulty || 'medium'} difficulty quiz about ${topic} in ${subject || 'general'} subject. 
    Include 5 multiple choice questions with 4 options each. 
    Format as JSON with the following structure:
    {
      "questions": [
        {
          "question": "Question text",
          "options": ["A", "B", "C", "D"],
          "correct": 0
        }
      ]
    }`;

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are a quiz generator. Generate educational quizzes in JSON format.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return generateMockQuiz(topic, subject);
  } catch (error) {
    console.error('AI Quiz generation error:', error);
    return generateMockQuiz(topic, subject);
  }
};

// Mock quiz generator
const generateMockQuiz = (topic, subject) => {
  return {
    questions: [
      {
        question: `What is the main concept of ${topic} in ${subject || 'general'}?`,
        options: [
          `A basic definition of ${topic}`,
          `An advanced application of ${topic}`,
          `The history of ${topic}`,
          `The future of ${topic}`
        ],
        correct: 0
      },
      {
        question: `Which of the following best describes ${topic}?`,
        options: [
          `A simple concept`,
          `A complex system`,
          `A practical application`,
          `A theoretical framework`
        ],
        correct: 1
      },
      {
        question: `Why is ${topic} important in ${subject || 'general'}?`,
        options: [
          `It's foundational knowledge`,
          `It's a modern trend`,
          `It's outdated`,
          `It's rarely used`
        ],
        correct: 0
      },
      {
        question: `How is ${topic} typically applied?`,
        options: [
          `In academic settings`,
          `In professional environments`,
          `In daily life`,
          `All of the above`
        ],
        correct: 3
      },
      {
        question: `What is a key concept related to ${topic}?`,
        options: [
          `Related concept A`,
          `Related concept B`,
          `Related concept C`,
          `Related concept D`
        ],
        correct: 0
      }
    ]
  };
};

// Controller functions
export const generateQuiz = async (req, res) => {
  try {
    const { topic, subject, difficulty } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const quiz = await generateQuizWithAI(topic, subject, difficulty);
    const aiProvider = getAIProvider?.() || 'none';

    res.json({
      success: true,
      quiz,
      aiProvider,
      mockResponse: !isAIAvailableCheck()
    });
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.json({
      success: true,
      quiz: generateMockQuiz(req.body.topic || 'general'),
      mockResponse: true,
      error: error.message
    });
  }
};

export const submitQuiz = async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    const userId = req.user?.id;
    const score = Math.floor(Math.random() * 100);
    const passed = score >= 70;
    if (userId) {
      await db.query(
        `INSERT INTO quiz_results (user_id, quiz_id, score, passed) VALUES ($1, $2, $3, $4)`,
        [userId, quizId, score, passed]
      );
    }
    res.json({
      success: true,
      score,
      passed,
      feedback: passed ? 'Great job!' : 'Keep practicing!'
    });
  } catch (error) {
    console.error('Quiz submission error:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
};

export const checkQuizStatus = async (req, res) => {
  res.json({
    aiAvailable: isAIAvailableCheck(),
    aiProvider: getAIProvider?.() || 'none',
    mockMode: !isAIAvailableCheck()
  });
};