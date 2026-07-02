import OpenAI from 'openai';
import db from '../config/db.js';

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

  // ✅ Fix: join with challenges to get title
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

  const prompt = `
You are a personal career and learning mentor. Based on the following learner profile, generate **personalized** recommendations.

**Learner Profile**:
- Name: ${profile.full_name}
- Course: ${profile.course || 'Not specified'}
- Education Level: ${profile.education_level || 'Not specified'}
- Institution: ${profile.institution || 'Not specified'}
- Interests: ${profile.interests ? profile.interests.join(', ') : 'Not specified'}
- Learning Style: ${profile.learning_style || 'Not specified'}
- Career Goal: ${profile.career_goal || 'Not specified'}
- Current XP: ${profile.xp}, Level: ${profile.level}

**Recent Activity**:
- Completed Tasks: ${activity.tasks.filter(t => t.is_completed).length} / ${activity.tasks.length}
- Recent Challenge Status: ${activity.challenges.map(c => c.title + ' (' + c.status + ')').join(', ')}

Generate **5 recommendations** covering these categories:
1. **Goal**: A specific, measurable learning goal for the next 2 weeks.
2. **Challenge**: A concrete challenge that would help build skills.
3. **Study Suggestion**: A specific topic or resource to study next.
4. **Career Pathway**: A short‑term action (e.g., connect with an industry mentor, take a certification).
5. **Recommendation**: Any additional suggestion (e.g., join a community, attend a webinar).

Return ONLY valid JSON in this format:
{
  "goal": { "title": "...", "description": "...", "xp_reward": 50 },
  "challenge": { "title": "...", "description": "...", "difficulty": "medium" },
  "study": { "topic": "...", "resource": "..." },
  "career": { "action": "...", "reason": "..." },
  "extra": { "suggestion": "..." }
}
`;

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
};

// ---------- API Endpoints ----------

export const generatePersonalization = async (req, res) => {
  try {
    const userId = req.user.id;
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

    res.json({ success: true, recommendations });
  } catch (err) {
    console.error(err);
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