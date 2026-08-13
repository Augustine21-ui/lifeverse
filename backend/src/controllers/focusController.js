// backend/src/controllers/focusController.js
import { getAI, isAIAvailableCheck, getAIProvider, generateMockResponse } from '../utils/aiUtils.js';

export const getFocusSuggestion = async (req, res) => {
  try {
    const { topic, subject } = req.body;
    
    if (!isAIAvailableCheck()) {
      return res.json({
        suggestion: generateMockResponse('focus', topic || subject || 'studying'),
        mock: true
      });
    }

    const { openai, aiProvider } = getAI();
    const completion = await openai.chat.completions.create({
      model: aiProvider === 'groq' ? "llama-3.3-70b-versatile" : "gpt-3.5-turbo",
      messages: [
        { role: 'system', content: 'You are a focus coach. Provide brief, actionable focus tips.' },
        { role: 'user', content: `Give me a focus tip for studying ${topic || subject || 'general'}` }
      ],
      max_tokens: 150,
    });

    res.json({
      suggestion: completion.choices[0].message.content,
      mock: false
    });
  } catch (error) {
    console.error('Focus suggestion error:', error);
    res.json({
      suggestion: generateMockResponse('focus', req.body.topic || 'studying'),
      mock: true
    });
  }
};