import { query } from './db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const generateToken = () => crypto.randomBytes(32).toString('hex');

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    const userRes = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }
    const userId = userRes.rows[0].id;
    await query('DELETE FROM password_resets WHERE user_id = $1', [userId]);
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, token, expiresAt]
    );
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    // Send email
    await transporter.sendMail({
      from: `"LifeVerse" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset your LifeVerse password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #8b5cf6;">LifeVerse Password Reset</h2>
          <p>You requested to reset your password. Click the button below to create a new one:</p>
          <a href="${resetLink}" style="display: inline-block; background: #8b5cf6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; margin: 15px 0;">Reset Password</a>
          <p>If you didn't request this, please ignore this email.</p>
          <p style="color: #666; font-size: 12px;">This link expires in 1 hour.</p>
          <hr />
          <p style="color: #999; font-size: 11px;">LifeVerse – Safe learning space</p>
        </div>
      `,
    });

    console.log('Reset link sent to:', email);
    res.json({ message: 'Reset link sent to your email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password required' });
  try {
    const resetRes = await query(
      'SELECT user_id, expires_at FROM password_resets WHERE token = $1 AND used = FALSE',
      [token]
    );
    if (resetRes.rows.length === 0) return res.status(400).json({ error: 'Invalid or expired token' });
    const reset = resetRes.rows[0];
    if (new Date() > new Date(reset.expires_at)) {
      await query('DELETE FROM password_resets WHERE token = $1', [token]);
      return res.status(400).json({ error: 'Token expired' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, reset.user_id]);
    await query('UPDATE password_resets SET used = TRUE WHERE token = $1', [token]);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
