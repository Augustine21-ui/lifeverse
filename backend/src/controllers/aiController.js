// backend/src/controllers/aiController.js
import { 
  getAI, 
  isAIAvailableCheck, 
  generateMockResponse, 
  getModelForProvider 
} from '../utils/aiUtils.js';
import { query } from '../db.js';

// ─── EXPLAIN ──────────────────────────────────────────────────────
export const explain = async (req, res) => {
  try {
    const { concept, level } = req.body;
    
    if (!concept) {
      return res.status(400).json({ error: 'Concept is required' });
    }

    if (!isAIAvailableCheck()) {
      return res.json({
        explanation: generateMockResponse('tutor', concept),
        mock: true,
        message: 'AI is currently in mock mode. Add GROQ_API_KEY or OPENAI_API_KEY to enable real AI.'
      });
    }

    try {
      const { openai, aiProvider } = getAI();
      const model = getModelForProvider(aiProvider);
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: 'You are an AI tutor. Explain concepts clearly and concisely.' },
          { role: 'user', content: `Explain the concept of "${concept}" at a ${level || 'beginner'} level.` }
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      res.json({
        explanation: completion.choices[0].message.content,
        mock: false,
        aiProvider
      });
    } catch (aiError) {
      console.error('AI API error:', aiError);
      res.json({
        explanation: generateMockResponse('tutor', concept),
        mock: true,
        message: 'AI service temporarily unavailable. Using mock response.'
      });
    }
  } catch (error) {
    console.error('Explain error:', error);
    res.status(500).json({ 
      error: 'Failed to explain concept',
      message: error.message 
    });
  }
};

// ─── AI TUTOR CHAT ──────────────────────────────────────────────
export const tutorChat = async (req, res) => {
  try {
    const { message, context } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get user context – only use columns that exist
    let userContext = '';
    try {
      const userRes = await query(
        'SELECT education_level, institution FROM users WHERE id = $1',
        [userId]
      );
      if (userRes.rows.length > 0) {
        const user = userRes.rows[0];
        userContext = `Student is at ${user.education_level || 'university'} level.`;
        if (user.institution) {
          userContext += ` Attends: ${user.institution}.`;
        }
      } else {
        userContext = 'Student is at university level.';
      }
    } catch (err) {
      console.warn('Could not fetch user context:', err.message);
      userContext = 'Student is at university level.';
    }

    if (!isAIAvailableCheck()) {
      return res.json({
        reply: generateMockResponse('tutor', message),
        mock: true,
        message: 'AI is currently in mock mode. Add GROQ_API_KEY or OPENAI_API_KEY to enable real AI.'
      });
    }

    try {
      const { openai, aiProvider } = getAI();
      const model = getModelForProvider(aiProvider);
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: `You are KUA AI Tutor. ${userContext} Provide clear, helpful explanations. If you cannot access real data, give a general response.` },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const reply = completion.choices[0]?.message?.content || 'I could not generate a response. Please try again.';
      res.json({ reply, mock: false, aiProvider });
    } catch (aiError) {
      console.error('AI API error:', aiError);
      res.json({
        reply: generateMockResponse('tutor', message),
        mock: true,
        message: 'AI service temporarily unavailable. Using mock response.'
      });
    }
  } catch (error) {
    console.error('AI Tutor error:', error);
    res.status(500).json({ error: 'AI Tutor failed', details: error.message });
  }
};

// ─── GENERATE QUIZ ──────────────────────────────────────────────
export const generateQuiz = async (req, res) => {
  try {
    const { topic, subject, difficulty = 'medium', questionCount = 5 } = req.body;

    if (!topic || !subject) {
      return res.status(400).json({ error: 'Topic and subject are required' });
    }

    if (!isAIAvailableCheck()) {
      return res.json({
        questions: [
          { question: `What is the capital of Kenya?`, options: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'], correct_answer: 0, explanation: 'Nairobi is the capital.' },
          { question: `2 + 2 = ?`, options: ['3', '4', '5', '6'], correct_answer: 1, explanation: '2+2=4' }
        ],
        mock: true
      });
    }

    const { openai, aiProvider } = getAI();
    const model = getModelForProvider(aiProvider);
    const systemPrompt = `You are an AI quiz generator. Generate ${questionCount} multiple-choice questions about "${topic}" in ${subject}. Difficulty: ${difficulty}. Return ONLY a JSON array with objects: { question, options (array of 4), correct_answer (index 0-3), explanation (brief) }.`;

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate ${questionCount} questions about ${topic} in ${subject}.` }
      ],
      max_tokens: 1000,
      temperature: 0.5,
    });

    const content = response.choices[0]?.message?.content || '[]';
    let questions = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) questions = JSON.parse(jsonMatch[0]);
      else questions = JSON.parse(content);
    } catch (e) {
      console.warn('Quiz parse error:', e.message);
      questions = [
        { question: `What is the capital of Kenya?`, options: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'], correct_answer: 0, explanation: 'Nairobi is the capital.' },
        { question: `2 + 2 = ?`, options: ['3', '4', '5', '6'], correct_answer: 1, explanation: '2+2=4' }
      ];
    }

    res.json({ questions, mock: false, aiProvider });
  } catch (error) {
    console.error('Generate Quiz error:', error);
    res.status(500).json({ error: 'Failed to generate quiz', details: error.message });
  }
};

// ─── GENERATE ORBIT CONTENT ─────────────────────────────────────
export const generateOrbitContent = async (req, res) => {
  try {
    const { subject, topic, activityType, grade = 'university' } = req.body;

    if (!subject || !topic) {
      return res.status(400).json({ error: 'Subject and topic are required' });
    }

    if (!isAIAvailableCheck()) {
      return res.json({
        activity: {
          title: `Learning ${topic}`,
          instructions: `Read about ${topic} and answer the questions.`,
          content: `This is a mock activity about ${topic} in ${subject}.`,
          hints: ['Think about the key concepts.', 'Review your notes.'],
          feedback: 'Great job! Keep learning.'
        },
        mock: true
      });
    }

    const { openai, aiProvider } = getAI();
    const model = getModelForProvider(aiProvider);
    const systemPrompt = `You are an AI content generator for KUA Orbit. Generate a ${activityType || 'educational'} activity about "${topic}" in ${subject} for ${grade} level. Make it engaging and age-appropriate. Return a JSON object with: title, instructions, content, hints (array), feedback.`;

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create a ${activityType || 'learning'} activity about ${topic} in ${subject}.` }
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || '{}';
    let activity = {};
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) activity = JSON.parse(jsonMatch[0]);
      else activity = JSON.parse(content);
    } catch (e) {
      console.warn('Orbit content parse error:', e.message);
      activity = {
        title: `Learning ${topic}`,
        instructions: `Read about ${topic} and answer the questions.`,
        content: `This is a learning activity about ${topic} in ${subject}.`,
        hints: ['Think about the key concepts.', 'Review your notes.'],
        feedback: 'Great job! Keep learning.'
      };
    }

    res.json({ activity, mock: false, aiProvider });
  } catch (error) {
    console.error('Generate Orbit Content error:', error);
    res.status(500).json({ error: 'Failed to generate orbit content', details: error.message });
  }
};

// ─── PERSONALIZED RECOMMENDATIONS ──────────────────────────────
export const getPersonalizedRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user data – only use columns that exist
    const userRes = await query(
      'SELECT full_name, education_level FROM users WHERE id = $1',
      [userId]
    );
    const user = userRes.rows[0] || {};

    // Get weak areas
    const weakRes = await query(
      'SELECT subject, topic, accuracy FROM orbit_progress WHERE user_id = $1 AND accuracy < 60 ORDER BY accuracy ASC LIMIT 3',
      [userId]
    );
    const weakAreas = weakRes.rows || [];

    // Get goals
    const goalsRes = await query(
      'SELECT title, category FROM goals WHERE user_id = $1 AND completed = false LIMIT 3',
      [userId]
    );
    const goals = goalsRes.rows || [];

    if (!isAIAvailableCheck()) {
      return res.json({
        recommendations: [
          { title: 'Start a Focus Session', description: 'You haven\'t studied today. Start a 25-minute focus session.', action: 'Start Focus Session', priority: 'high' },
          { title: 'Practice in Orbit', description: 'Try Orbit Cortex mode to strengthen your weak areas.', action: 'Launch Orbit', priority: 'medium' },
          { title: 'Complete Your Tasks', description: 'You have pending tasks. Complete them to earn XP.', action: 'View Tasks', priority: 'high' }
        ],
        mock: true
      });
    }

    const { openai, aiProvider } = getAI();
    const model = getModelForProvider(aiProvider);
    const context = `
User: ${user.full_name || 'Student'}
Education Level: ${user.education_level || 'Not specified'}
Weak Areas: ${weakAreas.map(w => `${w.subject} - ${w.topic} (${w.accuracy}% accuracy)`).join(', ') || 'None identified'}
Goals: ${goals.map(g => `${g.category}: ${g.title}`).join(', ') || 'No active goals'}
`;

    const systemPrompt = `You are KUA AI Assistant. Provide 3 personalized learning recommendations for a student. Format: JSON array with objects { title, description, action, priority }. Keep it relevant to Kenya.`;

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: context }
      ],
      max_tokens: 400,
      temperature: 0.6,
    });

    const content = response.choices[0]?.message?.content || '[]';
    let recommendations = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) recommendations = JSON.parse(jsonMatch[0]);
      else recommendations = JSON.parse(content);
    } catch (e) {
      console.warn('Recommendations parse error:', e.message);
      recommendations = [
        { title: 'Start a Focus Session', description: 'You haven\'t studied today. Start a 25-minute focus session.', action: 'Start Focus Session', priority: 'high' },
        { title: 'Practice in Orbit', description: 'Try Orbit Cortex mode to strengthen your weak areas.', action: 'Launch Orbit', priority: 'medium' },
        { title: 'Complete Your Tasks', description: 'You have pending tasks. Complete them to earn XP.', action: 'View Tasks', priority: 'high' }
      ];
    }

    res.json({ recommendations, mock: false, aiProvider });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations', details: error.message });
  }
};