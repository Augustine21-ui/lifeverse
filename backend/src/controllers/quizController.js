// backend/src/controllers/quizController.js

// ✅ Conditional initialization - try Groq first
let openai = null;
let isAIAvailable = false;
let aiProvider = 'none';

const groqApiKey = process.env.GROQ_API_KEY;
const openAiKey = process.env.OPENAI_API_KEY;

// Try Groq first
if (groqApiKey && groqApiKey !== 'your_groq_api_key_here' && groqApiKey.startsWith('gsk_')) {
  try {
    const OpenAI = (await import('openai')).default;
    openai = new OpenAI({
      apiKey: groqApiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
    isAIAvailable = true;
    aiProvider = 'groq';
    console.log('✅ Groq AI initialized for quiz');
  } catch (error) {
    console.warn('⚠️ Failed to initialize Groq for quiz:', error.message);
  }
} else if (openAiKey && openAiKey !== 'your_openai_api_key_here') {
  try {
    const OpenAI = (await import('openai')).default;
    openai = new OpenAI({
      apiKey: openAiKey,
    });
    isAIAvailable = true;
    aiProvider = 'openai';
    console.log('✅ OpenAI initialized for quiz');
  } catch (error) {
    console.warn('⚠️ Failed to initialize OpenAI for quiz:', error.message);
  }
}

if (!isAIAvailable) {
  console.log('ℹ️ AI Quiz disabled - running in mock mode');
}

// Helper to get AI response for quiz generation
const generateQuizWithAI = async (topic, subject, difficulty) => {
  if (!isAIAvailable || !openai) {
    // Return a mock quiz
    return generateMockQuiz(topic, subject);
  }

  try {
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
      model: aiProvider === 'groq' ? "llama-3.3-70b-versatile" : "gpt-3.5-turbo",
      messages: [
        { role: 'system', content: 'You are a quiz generator. Generate educational quizzes in JSON format.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices[0].message.content;
    // Try to parse JSON from the response
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
    
    res.json({
      success: true,
      quiz: quiz,
      aiProvider: aiProvider,
      mockResponse: !isAIAvailable
    });
  } catch (error) {
    console.error('Quiz generation error:', error);
    // Always return a mock quiz on error
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

    // Calculate score (mock for now)
    const score = Math.floor(Math.random() * 100);
    const passed = score >= 70;

    // Store result if user is authenticated
    if (userId) {
      // Save quiz result to database
      await db.query(
        `INSERT INTO quiz_results (user_id, quiz_id, score, passed) VALUES ($1, $2, $3, $4)`,
        [userId, quizId, score, passed]
      );
    }

    res.json({
      success: true,
      score: score,
      passed: passed,
      feedback: passed ? 'Great job!' : 'Keep practicing!'
    });
  } catch (error) {
    console.error('Quiz submission error:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
};

// Health check
export const checkQuizStatus = async (req, res) => {
  res.json({
    aiAvailable: isAIAvailable,
    aiProvider: aiProvider,
    mockMode: !isAIAvailable
  });
};