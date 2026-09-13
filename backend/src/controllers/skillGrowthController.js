// backend/src/controllers/skillGrowthController.js
// ✅ COMPLETE - With progress tracking + mood triggers

import db from '../config/db.js';

// ─── Get skill progress ────────────────────────────────────
export const getSkillProgress = async (req, res) => {
  try {
    const userId = req.user?.id;
    const skillId = req.params.skillId;

    const result = await db.query(
      `SELECT us.*, s.name as skill_name
       FROM user_skills us
       JOIN skills s ON s.id = us.skill_id
       WHERE us.user_id = $1 AND us.skill_id = $2`,
      [userId, skillId]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, progress: null });
    }

    res.json({ success: true, progress: result.rows[0] });
  } catch (err) {
    console.error('getSkillProgress error:', err);
    res.status(500).json({ error: 'Failed to fetch skill progress' });
  }
};

// ─── Update user skill (progress) ──────────────────────────
export const updateUserSkill = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { skill_id, progress_percent, level, competency_score } = req.body;

    if (!skill_id) return res.status(400).json({ error: 'skill_id is required' });

    const existing = await db.query(
      `SELECT * FROM user_skills WHERE user_id = $1 AND skill_id = $2`,
      [userId, skill_id]
    );

    const oldProgress = existing.rows[0]?.progress_percent || 0;
    const newProgress = progress_percent ?? oldProgress;
    const wasComplete = oldProgress >= 100;
    const isComplete = newProgress >= 100;

    let updated;

    if (existing.rows.length === 0) {
      const inserted = await db.query(
        `INSERT INTO user_skills
           (user_id, skill_id, level, progress_percent, competency_score, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING *`,
        [userId, skill_id, level || 'beginner', newProgress, competency_score || 0]
      );
      updated = inserted.rows[0];
    } else {
      const result = await db.query(
        `UPDATE user_skills
         SET progress_percent = $1,
             level = COALESCE($2, level),
             competency_score = COALESCE($3, competency_score),
             updated_at = NOW()
         WHERE user_id = $4 AND skill_id = $5
         RETURNING *`,
        [newProgress, level, competency_score, userId, skill_id]
      );
      updated = result.rows[0];
    }

    // Determine mood event
    let moodEvent = null;
    if (isComplete && !wasComplete) {
      moodEvent = 'skill-complete';
    } else if (newProgress > oldProgress && newProgress % 25 === 0) {
      // Every 25% milestone → celebrate
      moodEvent = 'skill-progress';
    }

    res.json({
      success: true,
      userSkill: updated,
      progressPercent: newProgress,
      moodEvent,
    });
  } catch (err) {
    console.error('updateUserSkill error:', err);
    res.status(500).json({ error: 'Failed to update user skill' });
  }
};

// ─── Get all user skills ──────────────────────────────────
export const getUserSkills = async (req, res) => {
  try {
    const userId = req.user?.id;
    const result = await db.query(
      `SELECT us.*, s.name as skill_name, s.category, s.icon
       FROM user_skills us
       JOIN skills s ON s.id = us.skill_id
       WHERE us.user_id = $1
       ORDER BY us.progress_percent DESC`,
      [userId]
    );
    res.json({ success: true, skills: result.rows });
  } catch (err) {
    console.error('getUserSkills error:', err);
    res.status(500).json({ error: 'Failed to fetch user skills' });
  }
};

// ─── Skills summary ────────────────────────────────────────
export const getSkillsSummary = async (req, res) => {
  try {
    const userId = req.user?.id;
    const result = await db.query(
      `SELECT
         COUNT(*) as total_skills,
         COALESCE(AVG(progress_percent), 0) as avg_progress,
         COUNT(*) FILTER (WHERE progress_percent >= 100) as completed_skills
       FROM user_skills WHERE user_id = $1`,
      [userId]
    );
    res.json({ success: true, summary: result.rows[0] });
  } catch (err) {
    console.error('getSkillsSummary error:', err);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
};

// ─── Submit practice result (+ mood trigger) ──────────────
export const submitPracticeResult = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { skillId, activityId, score, timeSpent } = req.body;

    if (!skillId || !activityId) {
      return res.status(400).json({ error: 'skillId and activityId are required' });
    }

    // Save result
    const inserted = await db.query(
      `INSERT INTO practice_results
         (user_id, activity_id, score, time_spent, completed_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [userId, activityId, score || 0, timeSpent || 0]
    );

    // Update skill progress (add 5% per practice)
    const existing = await db.query(
      `SELECT * FROM user_skills WHERE user_id = $1 AND skill_id = $2`,
      [userId, skillId]
    );

    let moodEvent = null;
    let newProgress = 0;

    if (existing.rows.length > 0) {
      const current = existing.rows[0].progress_percent || 0;
      newProgress = Math.min(current + 5, 100);
      const wasComplete = current >= 100;
      const isComplete = newProgress >= 100;

      await db.query(
        `UPDATE user_skills
         SET progress_percent = $1, updated_at = NOW()
         WHERE user_id = $2 AND skill_id = $3`,
        [newProgress, userId, skillId]
      );

      if (isComplete && !wasComplete) moodEvent = 'skill-complete';
      else moodEvent = 'skill-progress';
    } else {
      newProgress = 5;
      await db.query(
        `INSERT INTO user_skills
           (user_id, skill_id, progress_percent, level, created_at, updated_at)
         VALUES ($1, $2, $3, 'beginner', NOW(), NOW())`,
        [userId, skillId, newProgress]
      );
      moodEvent = 'skill-progress';
    }

    res.json({
      success: true,
      result: inserted.rows[0],
      progressPercent: newProgress,
      moodEvent,
    });
  } catch (err) {
    console.error('submitPracticeResult error:', err);
    res.status(500).json({ error: 'Failed to submit practice result' });
  }
};

// ─── Submit challenge + mood ───────────────────────────────
export const submitChallenge = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { skillId, challengeId, submission } = req.body;

    if (!skillId || !challengeId) {
      return res.status(400).json({ error: 'skillId and challengeId are required' });
    }

    const inserted = await db.query(
      `INSERT INTO challenge_submissions
         (user_id, challenge_id, status, submission_text, submitted_at)
       VALUES ($1, $2, 'submitted', $3, NOW())
       RETURNING *`,
      [userId, challengeId, submission || null]
    );

    // Auto-complete → award XP and trigger mood
    const xpReward = 25;
    await db.query(
      `UPDATE users SET xp = COALESCE(xp, 0) + $1 WHERE id = $2`,
      [xpReward, userId]
    );

    res.json({
      success: true,
      submission: inserted.rows[0],
      xpAwarded: xpReward,
      moodEvent: 'skill-progress',   // 👈 triggers celebrating
    });
  } catch (err) {
    console.error('submitChallenge error:', err);
    res.status(500).json({ error: 'Failed to submit challenge' });
  }
};

// ─── Get all skill-related progress ────────────────────────
export const getSkillProgressFull = async (req, res) => {
  try {
    const userId = req.user?.id;
    const skillId = req.params.skillId;

    const [userSkill, practice, challenges] = await Promise.all([
      db.query(
        `SELECT * FROM user_skills WHERE user_id = $1 AND skill_id = $2`,
        [userId, skillId]
      ),
      db.query(
        `SELECT COUNT(*) as count, COALESCE(AVG(score), 0) as avg_score
         FROM practice_results
         WHERE user_id = $1 AND activity_id IN (
           SELECT id FROM practice_activities WHERE skill_id = $2
         )`,
        [userId, skillId]
      ),
      db.query(
        `SELECT COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'approved') as approved
         FROM challenge_submissions
         WHERE user_id = $1 AND challenge_id IN (
           SELECT id FROM skill_challenges WHERE skill_id = $2
         )`,
        [userId, skillId]
      ),
    ]);

    res.json({
      success: true,
      userSkill: userSkill.rows[0] || null,
      practice: practice.rows[0],
      challenges: challenges.rows[0],
    });
  } catch (err) {
    console.error('getSkillProgressFull error:', err);
    res.status(500).json({ error: 'Failed to fetch skill progress' });
  }
};

// ─── Stubs (kept for API compatibility) ────────────────────
export const getProjects = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM skill_projects WHERE skill_id = $1`,
      [req.params.skillId]
    );
    res.json({ success: true, projects: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const assignProject = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { projectId } = req.body;
    const result = await db.query(
      `INSERT INTO project_assignments (user_id, project_id, status, created_at)
       VALUES ($1, $2, 'assigned', NOW()) RETURNING *`,
      [userId, projectId]
    );
    res.json({ success: true, assignment: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProjectContribution = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { assignmentId } = req.params;
    const { contribution_notes, status } = req.body;

    const result = await db.query(
      `UPDATE project_assignments
       SET contribution_notes = $1,
           status = COALESCE($2, status),
           updated_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [contribution_notes, status, assignmentId, userId]
    );

    res.json({ success: true, assignment: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUserProjects = async (req, res) => {
  try {
    const userId = req.user?.id;
    const result = await db.query(
      `SELECT pa.*, sp.title, sp.description
       FROM project_assignments pa
       JOIN skill_projects sp ON sp.id = pa.project_id
       WHERE pa.user_id = $1 AND sp.skill_id = $2`,
      [userId, req.params.skillId]
    );
    res.json({ success: true, projects: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getChallenges = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM skill_challenges WHERE skill_id = $1`,
      [req.params.skillId]
    );
    res.json({ success: true, challenges: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUserChallengeSubmissions = async (req, res) => {
  try {
    const userId = req.user?.id;
    const result = await db.query(
      `SELECT cs.* FROM challenge_submissions cs
       WHERE cs.user_id = $1 AND cs.challenge_id IN (
         SELECT id FROM skill_challenges WHERE skill_id = $2
       )`,
      [userId, req.params.skillId]
    );
    res.json({ success: true, submissions: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getPracticeActivities = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM practice_activities WHERE skill_id = $1`,
      [req.params.skillId]
    );
    res.json({ success: true, activities: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUserPracticeResults = async (req, res) => {
  try {
    const userId = req.user?.id;
    const result = await db.query(
      `SELECT pr.* FROM practice_results pr
       WHERE pr.user_id = $1 AND pr.activity_id IN (
         SELECT id FROM practice_activities WHERE skill_id = $2
       )`,
      [userId, req.params.skillId]
    );
    res.json({ success: true, results: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user?.id;
    const result = await db.query(
      `SELECT * FROM skill_recommendations
       WHERE user_id = $1 AND skill_id = $2`,
      [userId, req.params.skillId]
    );
    res.json({ success: true, recommendations: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createSkill = async (req, res) => {
  try {
    const { name, category, description, icon } = req.body;
    const result = await db.query(
      `INSERT INTO skills (name, category, description, icon, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [name, category, description, icon]
    );
    res.status(201).json({ success: true, skill: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};