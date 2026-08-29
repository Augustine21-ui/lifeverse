// backend/src/controllers/opportunityController.js
import { query } from '../db.js';

// ─── Helper: Get user's skills, interests, education, goals ──────
const getUserProfile = async (userId) => {
  // Get skills
  const skillsRes = await query(
    `SELECT s.name FROM user_skills us JOIN skills s ON us.skill_id = s.id WHERE us.user_id = $1`,
    [userId]
  );
  const skills = skillsRes.rows.map(r => r.name);
  
  // Get age from date_of_birth
  const ageRes = await query(
    `SELECT EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) AS age FROM users WHERE id = $1`,
    [userId]
  );
  const userAge = parseInt(ageRes.rows[0]?.age, 10) || 0;
  
  // Get education level (separate query, no age)
  const userRes = await query(
    `SELECT education_level FROM users WHERE id = $1`,
    [userId]
  );
  const education = userRes.rows[0]?.education_level || '';
  
  // Get interests – you need to define where interests come from.
  // Example: if you have a 'user_interests' table, query it.
  // For now, fallback to an empty array.
  let interests = [];
  try {
    const interestsRes = await query(
      `SELECT interest FROM user_interests WHERE user_id = $1`,
      [userId]
    );
    interests = interestsRes.rows.map(r => r.interest);
  } catch (e) {
    // If table doesn't exist, ignore
  }
  
  // Get goals
  const goalsRes = await query(
    `SELECT title, description FROM goals WHERE user_id = $1 AND completed = false`,
    [userId]
  );
  const goals = goalsRes.rows.map(g => g.title);
  
  return { skills, interests, education, age: userAge, goals };
};
// ─── Calculate match score ──────────────────────────────────────────
const calculateMatch = (opportunity, userProfile) => {
  const weights = opportunity.match_criteria || { skills: 0.4, interests: 0.25, education: 0.2, goals: 0.15 };
  let score = 0;
  let details = {};
  
  // Skills match
  const requiredSkills = opportunity.skills_required || [];
  const userSkills = userProfile.skills || [];
  const matchingSkills = requiredSkills.filter(s => userSkills.includes(s));
  const skillsMatch = requiredSkills.length > 0 ? matchingSkills.length / requiredSkills.length : 1;
  details.skills = { score: skillsMatch, matched: matchingSkills, total: requiredSkills.length };
  score += skillsMatch * weights.skills;
  
  // Interests match
  const requiredInterests = opportunity.interests || [];
  const userInterests = userProfile.interests || [];
  const matchingInterests = requiredInterests.filter(i => userInterests.includes(i));
  const interestsMatch = requiredInterests.length > 0 ? matchingInterests.length / requiredInterests.length : 1;
  details.interests = { score: interestsMatch, matched: matchingInterests, total: requiredInterests.length };
  score += interestsMatch * weights.interests;
  
  // Education match (simple: if opportunity requires education, check user's)
  const educationMatch = opportunity.education_level ? (userProfile.education === opportunity.education_level ? 1 : 0.5) : 1;
  details.education = { score: educationMatch, required: opportunity.education_level, user: userProfile.education };
  score += educationMatch * weights.education;
  
  // Goals match (check if opportunity title/desc matches user goals)
  const userGoals = userProfile.goals || [];
  const goalMatch = userGoals.some(g => opportunity.title.includes(g) || opportunity.description.includes(g)) ? 1 : 0.5;
  details.goals = { score: goalMatch };
  score += goalMatch * weights.goals;
  
  // Age match
  if (opportunity.age_min && userProfile.age < opportunity.age_min) score *= 0.5;
  if (opportunity.age_max && userProfile.age > opportunity.age_max) score *= 0.5;
  
  const finalScore = Math.round(Math.min(score, 1) * 100);
  return { score: finalScore, details };
};

// ─── Get personalized opportunities (For You) ──────────────────────
export const getPersonalized = async (req, res) => {
  const userId = req.user.id;
  try {
    const userProfile = await getUserProfile(userId);
    // Get published opportunities
    const opportunities = await query(
      `SELECT o.*, org.name as organization_name, org.logo_url, org.is_verified 
       FROM opportunities o
       JOIN organizations org ON o.organization_id = org.id
       WHERE o.status = 'published' AND o.deadline >= CURRENT_DATE
       ORDER BY o.created_at DESC`
    );
    // Calculate match for each
    const results = opportunities.rows.map(opp => {
      const match = calculateMatch(opp, userProfile);
      return { ...opp, match_score: match.score, match_details: match.details };
    });
    // Sort by match score descending
    results.sort((a, b) => b.match_score - a.match_score);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Get opportunities by type with filters ──────────────────────
export const getOpportunities = async (req, res) => {
  const userId = req.user.id;
  const { type, category, location, remote, skills, education_level } = req.query;
  try {
    let sql = `
      SELECT o.*, org.name as organization_name, org.logo_url, org.is_verified 
      FROM opportunities o
      JOIN organizations org ON o.organization_id = org.id
      WHERE o.status = 'published'
    `;
    const params = [];
    let paramIndex = 1;
    if (type) {
      sql += ` AND o.type = $${paramIndex++}`;
      params.push(type);
    }
    if (category) {
      sql += ` AND o.category = $${paramIndex++}`;
      params.push(category);
    }
    if (location) {
      sql += ` AND o.location ILIKE $${paramIndex++}`;
      params.push(`%${location}%`);
    }
    if (remote === 'true') {
      sql += ` AND o.is_remote = true`;
    }
    if (skills) {
      const skillArray = skills.split(',').map(s => s.trim());
      sql += ` AND o.skills_required && $${paramIndex++}`;
      params.push(skillArray);
    }
    if (education_level) {
      sql += ` AND o.education_level = $${paramIndex++}`;
      params.push(education_level);
    }
    sql += ` ORDER BY o.deadline ASC`;
    const result = await query(sql, params);
    // Add match scores if we have user profile
    const userProfile = await getUserProfile(userId);
    const enhanced = result.rows.map(opp => {
      const match = calculateMatch(opp, userProfile);
      return { ...opp, match_score: match.score, match_details: match.details };
    });
    res.json(enhanced);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Get single opportunity with full details ──────────────────────
export const getOpportunity = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const result = await query(
      `SELECT o.*, org.name as organization_name, org.logo_url, org.is_verified, org.description as org_description
       FROM opportunities o
       JOIN organizations org ON o.organization_id = org.id
       WHERE o.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Opportunity not found' });
    const opp = result.rows[0];
    const userProfile = await getUserProfile(userId);
    const match = calculateMatch(opp, userProfile);
    opp.match_score = match.score;
    opp.match_details = match.details;
    // Get application status if any
    const appRes = await query(
      `SELECT status, applied_at FROM opportunity_applications WHERE user_id = $1 AND opportunity_id = $2`,
      [userId, id]
    );
    opp.application = appRes.rows[0] || null;
    res.json(opp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Apply to opportunity ──────────────────────────────────────────
export const applyOpportunity = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    // 1. Check if opportunity exists
    const oppCheck = await query('SELECT id FROM opportunities WHERE id = $1', [id]);
    if (oppCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }
    
    // 2. Check if already applied
    const existing = await query(
      `SELECT id FROM opportunity_applications WHERE user_id = $1 AND opportunity_id = $2`,
      [userId, id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already applied' });
    }
    
    // 3. Insert application
    const result = await query(
      `INSERT INTO opportunity_applications (user_id, opportunity_id, status) VALUES ($1, $2, 'applied') RETURNING *`,
      [userId, id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Get user's applications ──────────────────────────────────────
export const getMyApplications = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query(
      `SELECT a.*, o.title, o.type, org.name as organization_name
       FROM opportunity_applications a
       JOIN opportunities o ON a.opportunity_id = o.id
       JOIN organizations org ON o.organization_id = org.id
       WHERE a.user_id = $1
       ORDER BY a.applied_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Seed Demo Organizations and Opportunities ─────────────────────
// (We'll create a separate endpoint or run migration)

// ─── Organization profile (for later) ──────────────────────────────
export const getOrganization = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(
      `SELECT * FROM organizations WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Organization not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};