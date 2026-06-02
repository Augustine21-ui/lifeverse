import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import pool from '../config/db.js';
import { calculateLevel } from '../models/xp.js';

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};

const formatUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  fullName: user.full_name,
  avatarUrl: user.avatar_url,
  bio: user.bio,
  educationLevel: user.education_level,
  xp: user.xp,
  level: user.level,
  streakDays: user.streak_days,
  createdAt: user.created_at,
});

export const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, email, password, fullName, educationLevel } = req.body;

    const existing = await pool.query('SELECT id FROM users WHERE email=$1 OR username=$2', [email, username]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email or username already taken' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, full_name, education_level, last_active_date)
       VALUES ($1,$2,$3,$4,$5,CURRENT_DATE) RETURNING *`,
      [username, email, passwordHash, fullName || username, educationLevel || 'secondary']
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    res.status(201).json({ token, user: formatUser(user) });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (!result.rows[0]) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    // Update streak
    const today = new Date().toISOString().split('T')[0];
    const lastActive = user.last_active_date ? new Date(user.last_active_date).toISOString().split('T')[0] : null;
    let streakDays = user.streak_days;

    if (lastActive) {
      const diff = Math.floor((new Date(today) - new Date(lastActive)) / (1000 * 60 * 60 * 24));
      if (diff === 1) streakDays += 1;
      else if (diff > 1) streakDays = 1;
    } else {
      streakDays = 1;
    }

    await pool.query('UPDATE users SET last_active_date=$1, streak_days=$2, updated_at=NOW() WHERE id=$3',
      [today, streakDays, user.id]);
    user.streak_days = streakDays;

    const token = generateToken(user.id);
    res.json({ token, user: formatUser(user) });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT u.*,
        (SELECT COUNT(*) FROM goals WHERE user_id=u.id AND status='completed') as goals_completed,
        (SELECT COUNT(*) FROM goals WHERE user_id=u.id AND status='active') as goals_active,
        (SELECT COUNT(*) FROM user_badges WHERE user_id=u.id) as badges_count,
        (SELECT COUNT(*) FROM community_members WHERE user_id=u.id) as communities_count
       FROM users u WHERE u.id=$1`,
      [req.user.id]
    );

    const user = result.rows[0];
    const { xp } = user;
    const xpProgress = xp % 500;

    res.json({
      ...formatUser(user),
      stats: {
        goalsCompleted: parseInt(user.goals_completed),
        goalsActive: parseInt(user.goals_active),
        badgesCount: parseInt(user.badges_count),
        communitiesCount: parseInt(user.communities_count),
        xpProgress,
        xpToNextLevel: 500,
        xpPercent: Math.round((xpProgress / 500) * 100),
      }
    });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { fullName, bio, educationLevel, avatarUrl } = req.body;
    const result = await pool.query(
      `UPDATE users SET full_name=COALESCE($1,full_name), bio=COALESCE($2,bio),
       education_level=COALESCE($3,education_level), avatar_url=COALESCE($4,avatar_url), updated_at=NOW()
       WHERE id=$5 RETURNING *`,
      [fullName, bio, educationLevel, avatarUrl, req.user.id]
    );
    res.json({ user: formatUser(result.rows[0]) });
  } catch (err) {
    next(err);
  }
};