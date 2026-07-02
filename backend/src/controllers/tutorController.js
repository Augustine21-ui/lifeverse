import OpenAI from 'openai';
import db from '../config/db.js';

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const SYSTEM_PROMPT = `You are a helpful AI tutor for the Lifeverse learning platform. 
You assist learners with various subjects, explain concepts, give examples, and encourage critical thinking. 
Keep responses concise and friendly.`;

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

    // ✅ Check if conversation exists before inserting
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
        // Update the user_id if it's different
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

    const completion = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiReply = completion.choices[0].message.content;

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

    res.json({ reply: aiReply, conversationId: convId });
  } catch (error) {
    console.error('AI Tutor error:', error);
    res.status(500).json({ error: 'AI tutor failed. Please try again later.' });
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