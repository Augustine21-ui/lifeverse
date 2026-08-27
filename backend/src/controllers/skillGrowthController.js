// backend/src/controllers/skillGrowthController.js
import { query } from '../db.js';

// ──────────────────────────────────────────────
// 1. GET skill progress (detailed breakdown)
// ──────────────────────────────────────────────
export const getSkillProgress = async (req, res) => {
  const userId = req.user.id;
  const { skillId } = req.params;

  try {
    // Get user_skill record
    const userSkillResult = await query(
      `SELECT * FROM user_skills WHERE user_id = $1 AND skill_id = $2`,
      [userId, skillId]
    );
    if (userSkillResult.rows.length === 0) {
      return res.status(404).json({ error: 'Skill not found for this user' });
    }
    const userSkill = userSkillResult.rows[0];

    // 1. Project contributions
    const projectsResult = await query(
      `SELECT COUNT(*) as total, 
              SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
       FROM project_assignments 
       WHERE user_id = $1 AND project_id IN (SELECT id FROM skill_projects WHERE skill_id = $2)`,
      [userId, skillId]
    );
    const projectStats = projectsResult.rows[0];
    const projectScore = projectStats.total > 0 ? (projectStats.completed / projectStats.total) : 0;

    // 2. Challenge completions
    const challengeResult = await query(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as completed
       FROM challenge_submissions cs
       JOIN skill_challenges sc ON cs.challenge_id = sc.id
       WHERE cs.user_id = $1 AND sc.skill_id = $2`,
      [userId, skillId]
    );
    const challengeStats = challengeResult.rows[0];
    const challengeScore = challengeStats.total > 0 ? (challengeStats.completed / challengeStats.total) : 0;

    // 3. Practice scores
    const practiceResult = await query(
      `SELECT AVG(score) as avg_score
       FROM practice_results pr
       JOIN practice_activities pa ON pr.activity_id = pa.id
       WHERE pr.user_id = $1 AND pa.skill_id = $2`,
      [userId, skillId]
    );
    const avgPractice = practiceResult.rows[0]?.avg_score || 0;
    const practiceScore = avgPractice / 100; // normalize to 0-1

    // 4. Community participation (simplified: count of posts/replies in recommended communities)
    // This requires tracking community participation per skill - we'll use a placeholder
    // For now, we'll fetch from user's community membership or a dedicated table.
    // We'll use a default value if no data.
    const communityResult = await query(
      `SELECT COUNT(*) as participation
       FROM community_memberships cm
       JOIN communities c ON cm.community_id = c.id
       WHERE cm.user_id = $1 AND c.skill_id = $2`,
      [userId, skillId]
    );
    const participationCount = parseInt(communityResult.rows[0]?.participation || 0);
    // Assume threshold of 5 interactions for full score
    const communityScore = Math.min(participationCount / 5, 1);

    // Weights
    const weights = { projects: 0.30, challenges: 0.25, practice: 0.25, community: 0.20 };
    const overallProgress = (
      projectScore * weights.projects +
      challengeScore * weights.challenges +
      practiceScore * weights.practice +
      communityScore * weights.community
    ) * 100;

    // Update user_skills progress_percent
    await query(
      `UPDATE user_skills SET progress_percent = $1, updated_at = NOW() WHERE user_id = $2 AND skill_id = $3`,
      [Math.round(overallProgress), userId, skillId]
    );

    // Return breakdown
    res.json({
      success: true,
      progress: {
        overall: Math.round(overallProgress),
        projectScore: Math.round(projectScore * 100),
        challengeScore: Math.round(challengeScore * 100),
        practiceScore: Math.round(practiceScore * 100),
        communityScore: Math.round(communityScore * 100),
        details: {
          projects: { completed: projectStats.completed, total: projectStats.total },
          challenges: { completed: challengeStats.completed, total: challengeStats.total },
          practice: { avgScore: avgPractice },
          community: { interactions: participationCount }
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ──────────────────────────────────────────────
// 2. PROJECTS
// ──────────────────────────────────────────────

// Get projects for a skill
export const getProjects = async (req, res) => {
  const { skillId } = req.params;
  try {
    const result = await query(
      `SELECT * FROM skill_projects WHERE skill_id = $1 ORDER BY difficulty_level`,
      [skillId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Assign a project to the current user
export const assignProject = async (req, res) => {
  const userId = req.user.id;
  const { projectId } = req.body;
  try {
    // Check if already assigned
    const existing = await query(
      `SELECT id FROM project_assignments WHERE user_id = $1 AND project_id = $2`,
      [userId, projectId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Project already assigned' });
    }
    const result = await query(
      `INSERT INTO project_assignments (user_id, project_id, status)
       VALUES ($1, $2, 'assigned') RETURNING *`,
      [userId, projectId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Update project contribution (status, notes)
export const updateProjectContribution = async (req, res) => {
  const userId = req.user.id;
  const { assignmentId } = req.params;
  const { status, contribution_notes } = req.body;
  try {
    const result = await query(
      `UPDATE project_assignments
       SET status = COALESCE($1, status),
           contribution_notes = COALESCE($2, contribution_notes),
           updated_at = NOW(),
           completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE completed_at END
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [status, contribution_notes, assignmentId, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    // After update, recalc progress for the skill
    // (We'll trigger a background job or call getSkillProgress internally)
    // For simplicity, we'll just return success and let the frontend refresh.
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Get user's assigned projects for a skill
export const getUserProjects = async (req, res) => {
  const userId = req.user.id;
  const { skillId } = req.params;
  try {
    const result = await query(
      `SELECT pa.*, sp.title, sp.description, sp.difficulty_level
       FROM project_assignments pa
       JOIN skill_projects sp ON pa.project_id = sp.id
       WHERE pa.user_id = $1 AND sp.skill_id = $2
       ORDER BY pa.created_at DESC`,
      [userId, skillId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ──────────────────────────────────────────────
// 3. CHALLENGES
// ──────────────────────────────────────────────

// Get challenges for a skill
export const getChallenges = async (req, res) => {
  const { skillId } = req.params;
  try {
    const result = await query(
      `SELECT * FROM skill_challenges WHERE skill_id = $1 ORDER BY difficulty_level`,
      [skillId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Submit a challenge solution
export const submitChallenge = async (req, res) => {
  const userId = req.user.id;
  const { challengeId, submission_text } = req.body;
  try {
    // Check if already submitted
    const existing = await query(
      `SELECT id FROM challenge_submissions WHERE user_id = $1 AND challenge_id = $2`,
      [userId, challengeId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already submitted this challenge' });
    }
    const result = await query(
      `INSERT INTO challenge_submissions (user_id, challenge_id, submission_text, status)
       VALUES ($1, $2, $3, 'pending') RETURNING *`,
      [userId, challengeId, submission_text]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Get user's challenge submissions for a skill
export const getUserChallengeSubmissions = async (req, res) => {
  const userId = req.user.id;
  const { skillId } = req.params;
  try {
    const result = await query(
      `SELECT cs.*, sc.title, sc.description, sc.difficulty_level
       FROM challenge_submissions cs
       JOIN skill_challenges sc ON cs.challenge_id = sc.id
       WHERE cs.user_id = $1 AND sc.skill_id = $2
       ORDER BY cs.submitted_at DESC`,
      [userId, skillId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ──────────────────────────────────────────────
// 4. PRACTICE ACTIVITIES
// ──────────────────────────────────────────────

// Get practice activities (could be AI-generated or static)
export const getPracticeActivities = async (req, res) => {
  const { skillId } = req.params;
  try {
    const result = await query(
      `SELECT * FROM practice_activities WHERE skill_id = $1 ORDER BY difficulty_level`,
      [skillId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Submit practice result
export const submitPracticeResult = async (req, res) => {
  const userId = req.user.id;
  const { activityId, score, time_spent } = req.body;
  try {
    const result = await query(
      `INSERT INTO practice_results (user_id, activity_id, score, time_spent)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, activityId, score, time_spent]
    );
    // After submitting, update progress
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Get user's practice results for a skill
export const getUserPracticeResults = async (req, res) => {
  const userId = req.user.id;
  const { skillId } = req.params;
  try {
    const result = await query(
      `SELECT pr.*, pa.title, pa.type
       FROM practice_results pr
       JOIN practice_activities pa ON pr.activity_id = pa.id
       WHERE pr.user_id = $1 AND pa.skill_id = $2
       ORDER BY pr.completed_at DESC`,
      [userId, skillId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ──────────────────────────────────────────────
// 5. RECOMMENDATIONS
// ──────────────────────────────────────────────

// Get recommended communities, projects, challenges for a skill
export const getRecommendations = async (req, res) => {
  const { skillId } = req.params;
  const userId = req.user.id;
  try {
    // Get skill details to know category
    const skillResult = await query('SELECT category FROM skills WHERE id = $1', [skillId]);
    const category = skillResult.rows[0]?.category;

    // Communities: find communities with same category or matching skill
    const communities = await query(
      `SELECT * FROM communities 
       WHERE skill_id = $1 OR category = $2 
       ORDER BY member_count DESC LIMIT 5`,
      [skillId, category || '']
    );

    // Projects: recommended based on difficulty level (user's current level from user_skills)
    const userSkillResult = await query(
      `SELECT level FROM user_skills WHERE user_id = $1 AND skill_id = $2`,
      [userId, skillId]
    );
    const userLevel = userSkillResult.rows[0]?.level || 1;
    const projects = await query(
      `SELECT * FROM skill_projects 
       WHERE skill_id = $1 AND difficulty_level BETWEEN $2 AND $2+2
       ORDER BY difficulty_level LIMIT 5`,
      [skillId, userLevel]
    );

    // Challenges: top-rated or least attempted
    const challenges = await query(
      `SELECT sc.*, 
              (SELECT COUNT(*) FROM challenge_submissions WHERE challenge_id = sc.id) as submission_count
       FROM skill_challenges sc
       WHERE sc.skill_id = $1
       ORDER BY submission_count ASC, sc.difficulty_level ASC
       LIMIT 5`,
      [skillId]
    );

    res.json({
      communities: communities.rows,
      projects: projects.rows,
      challenges: challenges.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ──────────────────────────────────────────────
// 6. Create a new skill (student-initiated)
// ──────────────────────────────────────────────
// backend/src/controllers/skillGrowthController.js

export const createSkill = async (req, res) => {
  const userId = req.user.id;
  const { name, category, description } = req.body;
  
  try {
    // 1. Insert into skills
    const skillResult = await query(
      `INSERT INTO skills (name, category, description) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [name, category, description]
    );
    const skill = skillResult.rows[0];

    // 2. IMPORTANT: Insert into user_skills to link skill to user
    await query(
      `INSERT INTO user_skills (user_id, skill_id, progress_percent) 
       VALUES ($1, $2, 0)`,
      [userId, skill.id]
    );

    res.status(201).json(skill);
  } catch (err) {
    console.error('Create skill error:', err);
    res.status(500).json({ error: err.message });
  }
};