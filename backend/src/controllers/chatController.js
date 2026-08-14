// backend/src/controllers/chatController.js
import { getAI, isAIAvailableCheck, getAIProvider, generateMockResponse } from '../utils/aiUtils.js';

export const chat = async (req, res) => {
  try {
    const { message, subject, topic, conversation, conversationId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if AI is available
    if (!isAIAvailableCheck()) {
      return res.json({
        reply: generateMockResponse('tutor', message),
        conversationId: conversationId || Date.now().toString(),
        mock: true,
        message: 'AI is currently in mock mode. Add GROQ_API_KEY to enable real AI.'
      });
    }

    try {
      const { openai, aiProvider } = getAI();
      
      // Build a prompt with conversation history
      let prompt = `You are an AI tutor for Lifeverse. You help students learn ${subject || 'various subjects'}${topic ? `, specifically ${topic}` : ''}. Be friendly, encouraging, and concise.\n\n`;
      
      if (conversation && conversation.length > 0) {
        // Add history
        conversation.forEach(msg => {
          prompt += `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.content}\n`;
        });
      }
      prompt += `Student: ${message}\nTutor:`;

      const completion = await openai.chat.completions.create({
        model: aiProvider === 'groq' ? "llama-3.3-70b-versatile" : "gpt-3.5-turbo",
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
      });

      const reply = completion.choices[0]?.message?.content || 'Sorry, I couldn’t generate a response.';

      res.json({
        reply: reply,
        conversationId: conversationId || Date.now().toString(),
        mock: false,
        aiProvider: aiProvider
      });
    } catch (aiError) {
      console.error('AI API error:', aiError);
      // Fallback to mock
      res.json({
        reply: generateMockResponse('tutor', message),
        conversationId: conversationId || Date.now().toString(),
        mock: true,
        message: 'AI service temporarily unavailable. Using mock response.'
      });
    }
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Failed to get AI response',
      message: error.message
    });
  }
};