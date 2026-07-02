import OpenAI from 'openai';
import db from '../config/db.js';

// ✅ Debug: log API key status at startup
console.log('🔑 GROQ key loaded?', !!process.env.GROQ_API_KEY);
console.log('First 5 chars:', process.env.GROQ_API_KEY?.substring(0, 5));

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// Helper: get user data for context
const getUserProfile = async (userId) => {
  const res = await db.query(`
    SELECT id, full_name, username, course, education_level, institution,
           interests, learning_style, career_goal, xp, level
    FROM users WHERE id = $1
  `, [userId]);
  return res.rows[0];
};

const getRecentActivity = async (userId) => {
  const tasks = await db.query(`
    SELECT title, is_completed, created_at
    FROM tasks WHERE user_id = $1
    ORDER BY created_at DESC LIMIT 10
  `, [userId]);

  const challenges = await db.query(`
    SELECT c.title, uc.status
    FROM user_challenges uc
    JOIN challenges c ON uc.challenge_id = c.id
    WHERE uc.user_id = $1
    ORDER BY uc.created_at DESC LIMIT 5
  `, [userId]);

  return { tasks: tasks.rows, challenges: challenges.rows };
};

const generateRecommendations = async (userId) => {
  const profile = await getUserProfile(userId);
  const activity = await getRecentActivity(userId);

  // ✅ TEMPORARY: simplified prompt to test if 403 disappears
  const prompt = `
Generate 5 personalized learning recommendations for a learner.
Return ONLY valid JSON with keys: goal, challenge, study, career, extra.
`;

  // ✅ Log prompt length
  console.log('📝 Prompt length:', prompt.length);

  try {
    const completion = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 1024,
    });

    const text = completion.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response');
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    // ✅ Log full error details
    console.error('❌ Groq API error in generateRecommendations:');
    console.error('Status:', err.status);
    console.error('Message:', err.message);
    if (err.response) {
      console.error('Response data:', err.response.data);
    }
    throw err;
  }
};

// ---------- API Endpoints ----------

export const generatePersonalization = async (req, res) => {
  try {
    const userId = req.user.id;

    // Delete all old recommendations for this user
    await db.query(
      `DELETE FROM personalized_recommendations WHERE user_id = $1`,
      [userId]
    );

    const recommendations = await generateRecommendations(userId);

    const types = ['goal', 'challenge', 'study', 'career'];
    for (const type of types) {
      const data = recommendations[type];
      if (!data) continue;
      await db.query(
        `INSERT INTO personalized_recommendations (user_id, type, title, description, data)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          userId,
          type,
          data.title || data.topic || data.action || type,
          data.description || data.reason || '',
          JSON.stringify(data)
        ]
      );
    }

    res.json({ success: true, recommendations });
  } catch (err) {
    console.error('❌ Error in generatePersonalization:', err);
    res.status(500).json({ error: err.message });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT * FROM personalized_recommendations
       WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY generated_at DESC LIMIT 10`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const actOnRecommendation = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(
      `UPDATE personalized_recommendations SET is_acted_upon = TRUE WHERE id = $1`,
      [id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};