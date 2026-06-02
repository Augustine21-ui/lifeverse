import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { query } from "./db.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role   // <-- add this line
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const register = async (req, res) => {
  try {
    const { fullName, username, email, password, educationLevel, institution, course, role } = req.body;
    if (!fullName || !username || !email || !password || !institution) {
      return res.status(400).json({ error: 'Missing required fields (including institution)' });
    }

    // Check institution subscription
    const instResult = await query(
      'SELECT subscription_status, subscription_end_date FROM institutions WHERE name = $1',
      [institution]
    );
    if (instResult.rows.length === 0) {
      return res.status(400).json({ error: 'Institution not recognized. Please contact your school administrator.' });
    }
    const inst = instResult.rows[0];
    if (inst.subscription_status !== 'active') {
      return res.status(403).json({ error: 'Your institution does not have an active subscription. Please ask them to subscribe.' });
    }
    if (inst.subscription_end_date && new Date(inst.subscription_end_date) < new Date()) {
      return res.status(403).json({ error: 'Institution subscription has expired. Contact administration.' });
    }

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Build columns and values dynamically based on whether course is provided
    const columns = ['full_name', 'username', 'email', 'password_hash', 'education_level', 'institution', 'role'];
    const values = [fullName, username, email, hashedPassword, educationLevel, institution, role || 'student'];
    if (course) {
      columns.push('course');
      values.push(course);
    }
    const placeholders = columns.map((_, i) => `$${i+1}`).join(',');
    const result = await query(
      `INSERT INTO users (${columns.join(',')}) VALUES (${placeholders}) RETURNING id, full_name, username, email, education_level, institution, role, course`,
      values
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'User registered', token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        username: user.username,
        email: user.email,
        educationLevel: user.education_level,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const result = await query('SELECT id, full_name, username, email, education_level, xp, level, role FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = result.rows[0];
    res.json({
      id: user.id,
      fullName: user.full_name,
      username: user.username,
      email: user.email,
      educationLevel: user.education_level,
      xp: user.xp,
      level: user.level,
      role: user.role   // <-- add this line
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
