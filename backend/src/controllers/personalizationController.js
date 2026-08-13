// backend/src/controllers/personalizationController.js
import db from '../config/db.js';

// ✅ Conditional initialization - try Groq first
let openai = null;
let isAIAvailable = false;
let aiProvider = 'none';

const groqApiKey = process.env.GROQ_API_KEY;
const openAiKey = process.env.OPENAI_API_KEY;

// Try to initialize with GROQ_API_KEY first
if (groqApiKey && groqApiKey !== 'your_groq_api_key_here' && groqApiKey.startsWith('gsk_')) {
  try {
    const { default: OpenAI } = await import('openai');
    openai = new OpenAI({
      apiKey: groqApiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
    isAIAvailable = true;
    aiProvider = 'groq';
    console.log('✅ Groq AI initialized for personalization');
  } catch (error) {
    console.warn('⚠️ Failed to initialize Groq for personalization:', error.message);
  }
} else if (openAiKey && openAiKey !== 'your_openai_api_key_here') {
  try {
    const { default: OpenAI } = await import('openai');
    openai = new OpenAI({
      apiKey: openAiKey,
    });
    isAIAvailable = true;
    aiProvider = 'openai';
    console.log('✅ OpenAI initialized for personalization');
  } catch (error) {
    console.warn('⚠️ Failed to initialize OpenAI for personalization:', error.message);
  }
}

if (!isAIAvailable) {
  console.log('ℹ️ Personalization AI disabled - running in mock mode');
}

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

// Mock recommendations generator
const generateMockRecommendations = (profile) => {
  return {
    goal: {
      title: `Set a goal to master ${profile?.course || 'your studies'}`,
      description: `Focus on completing 2-3 key assignments this week to build momentum.`
    },
    challenge: {
      title: `Take on a 7-day learning challenge`,
      description: `Study ${profile?.course || 'your subject'} for 30 minutes each day for the next week.`
    },
    study: {
      title: `Create a study schedule`,
      description: `Block out 2 hours of focused study time each morning when your energy is highest.`
    },
    career: {
      title: `Explore career connections`,
      description: `Research how ${profile?.course || 'your studies'} applies to real-world careers.`
    },
    extra: {
      title: `Join a study group`,
      description: `Connect with peers who are studying similar topics to share insights and stay motivated.`
    }
  };
};

// AI-powered recommendations
const generateRecommendations = async (userId) => {
  const profile = await getUserProfile(userId);
  const activity = await getRecentActivity(userId);

  // If AI is not available, return mock data
  if (!isAIAvailable || !openai) {
    console.log('ℹ️ Using mock recommendations for personalization');
    return generateMockRecommendations(profile);
  }

  // Build context from user profile
  const context = `
User Profile:
- Name: ${profile?.full_name || 'Learner'}
- Course: ${profile?.course || 'General'}
- Education Level: ${profile?.education_level || 'Not specified'}
- Interests: ${profile?.interests || 'Various'}
- Learning Style: ${profile?.learning_style || 'Mixed'}
- Career Goal: ${profile?.career_goal || 'Career development'}
- XP: ${profile?.xp || 0}
- Level: ${profile?.level || 1}

Recent Activity:
- Recent tasks: ${activity.tasks.map(t => `"${t.title}" (${t.is_completed ? '✅ Completed' : '⏳ Pending'})`).join(', ') || 'No recent tasks'}
- Recent challenges: ${activity.challenges.map(c => `"${c.title}" (${c.status})`).join(', ') || 'No recent challenges'}
`;

  const prompt = `
You are a personalized learning assistant for the Lifeverse platform. Based on the user's profile and recent activity, generate 5 personalized learning recommendations.

${context}

Return ONLY valid JSON with exactly these 5 keys: goal, challenge, study, career, extra.
Each recommendation should have: title, description, and a suggested action.

Format:
{
  "goal": { "title": "...", "description": "...", "action": "..." },
  "challenge": { "title": "...", "description": "...", "action": "..." },
  "study": { "title": "...", "description": "...", "action": "..." },
  "career": { "title": "...", "description": "...", "action": "..." },
  "extra": { "title": "...", "description": "...", "action": "..." }
}
`;

  console.log('📝 Generating personalization for user:', userId);

  try {
    const completion = await openai.chat.completions.create({
      model: aiProvider === 'groq' ? "llama-3.3-70b-versatile" : "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 800,
    });

    const text = completion.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response');
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('❌ AI error in generateRecommendations:', err.message);
    // Fallback to mock recommendations
    return generateMockRecommendations(profile);
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

    const types = ['goal', 'challenge', 'study', 'career', 'extra'];
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

    res.json({ 
      success: true, 
      recommendations,
      aiProvider: aiProvider,
      mockResponse: !isAIAvailable
    });
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

// Health check for AI status
export const checkPersonalizationStatus = async (req, res) => {
  res.json({
    aiAvailable: isAIAvailable,
    aiProvider: aiProvider,
    mockMode: !isAIAvailable
  });
};