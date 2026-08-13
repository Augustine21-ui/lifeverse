import OpenAI from 'openai';
import db from '../config/db.js';

// ✅ Conditional initialization - try Groq first, fallback to mock
let openai = null;
let isAIAvailable = false;
let aiProvider = 'none';

// Try to initialize with GROQ_API_KEY
const groqApiKey = process.env.GROQ_API_KEY;
const openAiKey = process.env.OPENAI_API_KEY;

if (groqApiKey && groqApiKey !== 'your_groq_api_key_here' && groqApiKey.startsWith('gsk_')) {
  try {
    openai = new OpenAI({
      apiKey: groqApiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
    isAIAvailable = true;
    aiProvider = 'groq';
    console.log('✅ Groq AI initialized successfully');
  } catch (error) {
    console.warn('⚠️ Failed to initialize Groq:', error.message);
  }
} else if (openAiKey && openAiKey !== 'your_openai_api_key_here') {
  try {
    openai = new OpenAI({
      apiKey: openAiKey,
    });
    isAIAvailable = true;
    aiProvider = 'openai';
    console.log('✅ OpenAI initialized successfully');
  } catch (error) {
    console.warn('⚠️ Failed to initialize OpenAI:', error.message);
  }
}

if (!isAIAvailable) {
  console.log('ℹ️ AI Tutor disabled - running in mock mode');
  console.log('   Set GROQ_API_KEY or OPENAI_API_KEY to enable');
}

const SYSTEM_PROMPT = `You are a helpful AI tutor for the Lifeverse learning platform. 
You assist learners with various subjects, explain concepts, give examples, and encourage critical thinking. 
Keep responses concise and friendly.`;

// Helper function to get AI response
const getAIResponse = async (messages) => {
  if (!isAIAvailable || !openai) {
    // Return a mock response
    return {
      success: true,
      content: "I'm currently in setup mode. Please configure your API key to enable AI responses. For now, here's a helpful tip: Break down complex problems into smaller, manageable steps!",
      mock: true
    };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: aiProvider === 'groq' ? "llama-3.3-70b-versatile" : "gpt-3.5-turbo",
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });
    
    return {
      success: true,
      content: completion.choices[0].message.content,
      mock: false
    };
  } catch (error) {
    console.error('AI API error:', error);
    return {
      success: false,
      error: error.message,
      content: "I'm having trouble connecting to my AI brain. Please try again later!",
      mock: true
    };
  }
};

export const chat = async (req, res) => {
  try {
    const { message, conversationId, fileUrl } = req.body;
    const userId = req.user?.id;

    if (!message && !fileUrl) {
      return res.status(400).json({ error: 'Message or file required' });
    }

    let userMessageContent = message || '';
    if (fileUrl) {
      userMessageContent += `\n[File: ${fileUrl}]`;
    }

    let convId = conversationId;
    if (!convId) {
      convId = Date.now().toString();
    }

    // Check if conversation exists before inserting
    if (userId) {
      const check = await db.query(
        `SELECT id FROM conversations WHERE id = $1`,
        [convId]
      );
      
      if (check.rows.length === 0) {
        await db.query(
          `INSERT INTO conversations (id, user_id, title) VALUES ($1, $2, $3)`,
          [convId, userId, userMessageContent.substring(0, 50)]
        );
      } else {
        await db.query(
          `UPDATE conversations SET user_id = $1, updated_at = NOW() WHERE id = $2`,
          [userId, convId]
        );
      }
    }

    // Fetch previous messages
    const messagesRes = await db.query(
      `SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [convId]
    );
    const history = messagesRes.rows;

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map(row => ({ role: row.role, content: row.content })),
      { role: 'user', content: userMessageContent },
    ];

    // Get AI response
    const aiResult = await getAIResponse(messages);
    
    if (!aiResult.success && !aiResult.mock) {
      throw new Error(aiResult.error || 'AI request failed');
    }

    const aiReply = aiResult.content;

    if (userId) {
      await db.query(
        `INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)`,
        [convId, 'user', userMessageContent]
      );
      await db.query(
        `INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)`,
        [convId, 'assistant', aiReply]
      );
      await db.query(
        `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
        [convId]
      );
    }

    res.json({ 
      reply: aiReply, 
      conversationId: convId,
      aiProvider: aiProvider,
      mockResponse: aiResult.mock || false
    });
  } catch (error) {
    console.error('AI Tutor error:', error);
    // Always return a friendly response even on error
    res.status(500).json({ 
      error: 'AI tutor is temporarily unavailable. Please try again later.',
      reply: "I'm having a technical moment! Please try again in a few seconds. 🙃",
      mockResponse: true
    });
  }
};

export const getConversationHistory = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const convCheck = await db.query(
      `SELECT id FROM conversations WHERE id = $1 AND user_id = $2`,
      [conversationId, userId]
    );
    
    if (convCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messagesRes = await db.query(
      `SELECT role, content, created_at FROM messages 
       WHERE conversation_id = $1 
       ORDER BY created_at ASC`,
      [conversationId]
    );
    
    res.json({ messages: messagesRes.rows });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

// Health check for AI service
export const checkAIStatus = async (req, res) => {
  res.json({
    aiAvailable: isAIAvailable,
    aiProvider: aiProvider,
    mockMode: !isAIAvailable
  });
};