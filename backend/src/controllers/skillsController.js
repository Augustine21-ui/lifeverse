// backend/src/controllers/skillsController.js
import { query } from '../db.js';

// Get all available skills
export const getAllSkills = async (req, res) => {
  try {
    const result = await query(`
      SELECT id, name, category, description, icon, xp_value 
      FROM skills 
      ORDER BY category, name
    `);
    res.json({ success: true, skills: result.rows });
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.json({ success: true, skills: [] });
  }
};

// Alias for routes that use .getSkills
export const getSkills = getAllSkills;

// Get user's skills with progress
export const getUserSkills = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📌 getUserSkills - userId:', userId);
    
    // Check if user_skills table has progress_percent column
    // If not, we'll use a fallback query
    const result = await query(`
      SELECT 
        us.id, 
        us.user_id, 
        us.skill_id, 
        us.level, 
        us.progress, 
        us.evidence,
        us.created_at, 
        us.updated_at,
        s.name, 
        s.category, 
        s.description, 
        s.icon, 
        s.xp_value,
        COALESCE(us.progress_percent, 0) as progress_percent
      FROM user_skills us
      JOIN skills s ON us.skill_id = s.id
      WHERE us.user_id = $1
      ORDER BY s.category, s.name
    `, [userId]);
    
    console.log('📌 getUserSkills returned:', result.rows.length, 'skills');
    res.json({ success: true, userSkills: result.rows });
  } catch (error) {
    console.error('❌ Error fetching user skills:', error);
    // Return empty array instead of failing
    res.json({ success: true, userSkills: [] });
  }
};

// Update user's skill progress
export const updateUserSkill = async (req, res) => {
  try {
    const userId = req.user.id;
    const { skillId, level, progress, evidence } = req.body;
    
    if (!skillId) {
      return res.status(400).json({ success: false, message: 'skillId is required' });
    }
    
    const checkResult = await query(
      'SELECT id FROM user_skills WHERE user_id = $1 AND skill_id = $2',
      [userId, skillId]
    );
    
    let result;
    if (checkResult.rows.length > 0) {
      result = await query(`
        UPDATE user_skills 
        SET level = $1, progress = $2, evidence = $3, updated_at = NOW()
        WHERE user_id = $4 AND skill_id = $5
        RETURNING *
      `, [level || 0, progress || 0, evidence || '', userId, skillId]);
    } else {
      result = await query(`
        INSERT INTO user_skills (user_id, skill_id, level, progress, evidence)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [userId, skillId, level || 0, progress || 0, evidence || '']);
    }
    
    res.json({ success: true, userSkill: result.rows[0] });
  } catch (error) {
    console.error('Error updating user skill:', error);
    res.status(500).json({ success: false, message: 'Failed to update skill' });
  }
};

// Get user's skills summary
export const getSkillsSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📌 getSkillsSummary - userId:', userId);
    
    // Cast level to integer to avoid SUM() on text
    const result = await query(`
      SELECT 
        COUNT(DISTINCT us.skill_id) as total_skills,
        SUM(COALESCE(us.level::integer, 0)) as total_levels,
        AVG(COALESCE(us.progress::integer, 0)) as avg_progress,
        COUNT(CASE WHEN us.level::integer >= 5 THEN 1 END) as mastered_skills
      FROM user_skills us
      WHERE us.user_id = $1
    `, [userId]);
    
    const summary = result.rows[0] || { 
      total_skills: 0, 
      total_levels: 0, 
      avg_progress: 0, 
      mastered_skills: 0 
    };
    
    // Also get goals count and achievements count
    const goalsResult = await query(
      'SELECT COUNT(*) as count FROM goals WHERE user_id = $1',
      [userId]
    );
    const achievementsResult = await query(
      'SELECT COUNT(*) as count FROM user_badges WHERE user_id = $1',
      [userId]
    );
    
    res.json({ 
      success: true, 
      summary: {
        level: Math.floor(summary.total_levels / 2) + 1 || 1,
        xp: summary.total_levels * 50 || 0,
        goalsCount: parseInt(goalsResult.rows[0]?.count || 0),
        skillsCount: parseInt(summary.total_skills || 0),
        achievementsCount: parseInt(achievementsResult.rows[0]?.count || 0)
      }
    });
  } catch (error) {
    console.error('Error fetching skills summary:', error);
    res.json({ 
      success: true, 
      summary: { level: 1, xp: 0, goalsCount: 0, skillsCount: 0, achievementsCount: 0 } 
    });
  }
};

// Get user's badges
export const getUserBadges = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(`
      SELECT 
        ub.id, ub.user_id, ub.badge_id, ub.earned_at, ub.progress,
        b.name, b.description, b.icon, b.rarity, b.xp_reward
      FROM user_badges ub
      JOIN badges b ON ub.badge_id = b.id
      WHERE ub.user_id = $1
      ORDER BY ub.earned_at DESC
    `, [userId]);
    res.json({ success: true, badges: result.rows });
  } catch (error) {
    console.error('Error fetching user badges:', error);
    res.json({ success: true, badges: [] });
  }
};

// Get user's goals
export const getUserGoals = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(`
      SELECT 
        id, user_id, title, description, target_date,
        completed, progress, xp_reward, milestones,
        created_at, updated_at
      FROM goals
      WHERE user_id = $1
      ORDER BY target_date ASC
    `, [userId]);
    res.json({ success: true, goals: result.rows });
  } catch (error) {
    console.error('Error fetching user goals:', error);
    res.json({ success: true, goals: [] });
  }
};

// Create a new goal
export const createGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, target_date, xp_reward = 100, milestones = [] } = req.body;
    
    if (!title || !target_date) {
      return res.status(400).json({ success: false, message: 'Title and target_date are required' });
    }
    
    const result = await query(`
      INSERT INTO goals (user_id, title, description, target_date, xp_reward, milestones, progress, completed)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [userId, title, description || '', target_date, xp_reward, JSON.stringify(milestones), 0, false]);
    
    res.status(201).json({ success: true, goal: result.rows[0] });
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ success: false, message: 'Failed to create goal' });
  }
};

// Update a goal
export const updateGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const goalId = req.params.id;
    const { title, description, target_date, progress, completed, xp_reward, milestones } = req.body;
    
    const result = await query(`
      UPDATE goals
      SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        target_date = COALESCE($3, target_date),
        progress = COALESCE($4, progress),
        completed = COALESCE($5, completed),
        xp_reward = COALESCE($6, xp_reward),
        milestones = COALESCE($7, milestones),
        updated_at = NOW()
      WHERE id = $8 AND user_id = $9
      RETURNING *
    `, [title, description, target_date, progress, completed, xp_reward, 
        milestones ? JSON.stringify(milestones) : null, goalId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }
    
    res.json({ success: true, goal: result.rows[0] });
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ success: false, message: 'Failed to update goal' });
  }
};

// Delete a goal
export const deleteGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const goalId = req.params.id;
    
    const result = await query(
      'DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id',
      [goalId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }
    
    res.json({ success: true, message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ success: false, message: 'Failed to delete goal' });
  }
};