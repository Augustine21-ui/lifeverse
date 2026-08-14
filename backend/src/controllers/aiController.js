// backend/src/controllers/aiController.js
import { getAI, isAIAvailableCheck, getAIProvider, generateMockResponse } from '../utils/aiUtils.js';

export const explain = async (req, res) => {
  try {
    const { concept, level } = req.body;
    
    if (!concept) {
      return res.status(400).json({ error: 'Concept is required' });
    }

    // Check if AI is available
    if (!isAIAvailableCheck()) {
      return res.json({
        explanation: generateMockResponse('tutor', concept),
        mock: true,
        message: 'AI is currently in mock mode. Add GROQ_API_KEY to enable real AI.'
      });
    }

    try {
      const { openai, aiProvider } = getAI();
      const completion = await openai.chat.completions.create({
        model: aiProvider === 'groq' ? "llama-3.3-70b-versatile" : "gpt-3.5-turbo",
        messages: [
          { role: 'system', content: 'You are an AI tutor. Explain concepts clearly and concisely.' },
          { role: 'user', content: `Explain the concept of "${concept}" at a ${level || 'beginner'} level.` }
        ],
        max_tokens: 300,
      });

      res.json({
        explanation: completion.choices[0].message.content,
        mock: false,
        aiProvider: aiProvider
      });
    } catch (aiError) {
      console.error('AI API error:', aiError);
      // Fallback to mock
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