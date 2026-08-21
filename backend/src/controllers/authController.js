// backend/src/controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import crypto from 'crypto';
import { sendResetEmail } from '../services/emailService.js';
import { isInstitutionSubscribed, getUserAccess } from '../services/subscriptionService.js';

const generateResetToken = () => crypto.randomBytes(32).toString('hex');

// ---------- LOGIN ----------
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // ✅ Include institution_id in the SELECT query
    const userRes = await db.query(
      `SELECT id, email, password_hash, full_name, role, institution, xp, level, streak_days,
              subscription_tier, subscription_status, trial_end_date, trial_used,
              subscription_end_date, institution_subscription_valid,
              institution_id   -- ✅ added
       FROM users WHERE email = $1`,
      [email]
    );
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = userRes.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const access = await getUserAccess(user.id);

    // ✅ Include institution_id in JWT payload
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, institution_id: user.institution_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        institution: user.institution,
        xp: user.xp,
        level: user.level,
        streak_days: user.streak_days,
        subscription: access,
        subscription_tier: user.subscription_tier,
        subscription_status: user.subscription_status,
        institution_subscription_valid: user.institution_subscription_valid,
        institution_id: user.institution_id // ✅ added
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ---------- REGISTER ----------
export const register = async (req, res) => {
  try {
    const { full_name, username, email, password, education_level, institution, course, role } = req.body;
    if (!username || !email || !password || !full_name) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Find institution ID if institution name is provided
    let institutionId = null;
    if (institution) {
      const instRes = await db.query(
        'SELECT id FROM institutions WHERE LOWER(name) = LOWER($1)',
        [institution.trim()]
      );
      if (instRes.rows.length > 0) {
        institutionId = instRes.rows[0].id;
      }
    }

    // Check institution subscription
    let institutionSubscribed = false;
    let subscriptionPlan = 'free';
    let subscriptionStatus = 'active';
    let trialStartDate = null;
    let trialEndDate = null;
    let trialUsed = false;

    if (institutionId) {
      const instRes = await db.query(
        'SELECT subscription_end_date FROM institutions WHERE id = $1',
        [institutionId]
      );
      
      if (instRes.rows.length > 0) {
        const endDate = new Date(instRes.rows[0].subscription_end_date);
        const now = new Date();
        institutionSubscribed = endDate > now;
        
        if (institutionSubscribed) {
          subscriptionPlan = 'premium';
          subscriptionStatus = 'active';
        } else {
          const nowDate = new Date();
          trialStartDate = nowDate;
          trialEndDate = new Date(nowDate);
          trialEndDate.setDate(trialEndDate.getDate() + 12);
          subscriptionPlan = 'free';
          subscriptionStatus = 'trial';
        }
      } else {
        const nowDate = new Date();
        trialStartDate = nowDate;
        trialEndDate = new Date(nowDate);
        trialEndDate.setDate(trialEndDate.getDate() + 12);
        subscriptionPlan = 'free';
        subscriptionStatus = 'trial';
      }
    } else {
      const nowDate = new Date();
      trialStartDate = nowDate;
      trialEndDate = new Date(nowDate);
      trialEndDate.setDate(trialEndDate.getDate() + 12);
      subscriptionPlan = 'free';
      subscriptionStatus = 'trial';
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Include institution_id in the INSERT
    const result = await db.query(
      `INSERT INTO users (
        full_name, username, email, password_hash, education_level, 
        institution, course, role,
        subscription_tier, subscription_status, trial_start_date, 
        trial_end_date, trial_used, institution_subscription_valid,
        institution_id   -- ✅ added
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id, username, email, full_name, role, subscription_tier, 
                subscription_status, trial_end_date, institution_subscription_valid,
                institution_id`,
      [
        full_name, username, email, hashedPassword, education_level || null,
        institution || null, course || null, role || 'student',
        subscriptionPlan, subscriptionStatus, trialStartDate,
        trialEndDate, trialUsed, institutionSubscribed,
        institutionId   // ✅ added
      ]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, institution_id: user.institution_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const access = await getUserAccess(user.id);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        subscription: access,
        subscription_tier: user.subscription_tier,
        subscription_status: user.subscription_status,
        institution_subscription_valid: user.institution_subscription_valid,
        institution_id: user.institution_id
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
};

// ---------- FORGOT PASSWORD ----------
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const userRes = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }

    const resetToken = generateResetToken();
    await db.query(
      `UPDATE users SET reset_token = $1, reset_token_expiry = NOW() + INTERVAL '1 hour' WHERE id = $2`,
      [resetToken, userRes.rows[0].id]
    );

    await sendResetEmail(email, resetToken);
    res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send reset email' });
  }
};

// ---------- RESET PASSWORD ----------
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }
    const userRes = await db.query(
      `SELECT id FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()`,
      [token]
    );
    if (userRes.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query(
      `UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2`,
      [hashedPassword, userRes.rows[0].id]
    );
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

// ---------- GET ME ----------
export const getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT id, username, email, full_name, role, xp, level, streak_days,
              institution, subscription_tier, subscription_status, trial_end_date,
              subscription_end_date, institution_subscription_valid,
              institution_id   -- ✅ added
       FROM users WHERE id = $1`,
      [userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const user = result.rows[0];
    const access = await getUserAccess(userId);
    
    res.json({
      ...user,
      subscription: access
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// ---------- GET SUBSCRIPTION STATUS ----------
export const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const access = await getUserAccess(userId);
    res.json(access);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
};