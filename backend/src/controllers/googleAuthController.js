import db from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const googleAuth = async (req, res) => {
  try {
    const { access_token, mode } = req.body;
    console.log('🔍 Google auth request:', { access_token: access_token?.slice(0, 20), mode });

    if (!access_token) {
      return res.status(400).json({ error: 'No access token provided' });
    }

    // Verify the Google token
    const googleResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const googleUser = await googleResponse.json();

    console.log('🔍 Google user info:', googleUser);

    if (!googleUser.email) {
      return res.status(400).json({ error: 'Invalid Google token' });
    }

    // Check if user exists
    const userRes = await db.query(
      'SELECT id, email, full_name, role, xp, level FROM users WHERE email = $1',
      [googleUser.email]
    );

    if (userRes.rows.length > 0) {
      // User exists – log them in
      const user = userRes.rows[0];
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({ token, user });
    }

    // User doesn't exist – register them (if mode is 'register')
    if (mode === 'register') {
      const username = googleUser.email.split('@')[0] + Math.floor(Math.random() * 1000);
      const fullName = googleUser.name || googleUser.email.split('@')[0];
      const randomPassword = Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      const result = await db.query(
        `INSERT INTO users (username, email, password_hash, full_name, role, xp, level)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, role, full_name`,
        [username, googleUser.email, hashedPassword, fullName, 'student', 0, 1]
      );

      const user = result.rows[0];
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({ token, user });
    }

    return res.status(404).json({ error: 'User not found. Please register first.' });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Google authentication failed' });
  }
};