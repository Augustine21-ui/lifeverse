import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
// import pool from '../config/db.js';   // temporarily comment out

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const register = async (req, res) => {
  try {
    const { fullName, username, email, password, educationLevel } = req.body;
    if (!fullName || !username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const token = jwt.sign({ username, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { fullName, username, email, educationLevel }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  res.status(501).json({ error: 'Login not implemented yet' });
};

export const getMe = async (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
};
