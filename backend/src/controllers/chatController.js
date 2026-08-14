import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const chat = async (req, res) => {
  try {
    const { message, subject, topic, conversation } = req.body;

    // Build a prompt with conversation history
    let prompt = `You are an AI tutor for Lifeverse. You help students learn ${subject || 'various subjects'}${topic ? `, specifically ${topic}` : ''}. Be friendly, encouraging, and concise.\n\n`;
    
    if (conversation && conversation.length > 0) {
      // Add history
      conversation.forEach(msg => {
        prompt += `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.content}\n`;
      });
    }
    prompt += `Student: ${message}\nTutor:`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 500,
    });

    const reply = chatCompletion.choices[0]?.message?.content || 'Sorry, I couldn’t generate a response.';

    res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
};

export const chat = async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    res.json({
      reply: `I received your message: "${message}". This is a mock response.`,
      conversationId: conversationId || Date.now().toString(),
      mock: true,
      message: "Chat response (mock mode)"
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Chat failed" });
  }
};