import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { query } from "./db.js";

export const register = async (req, res) => {
  try {
    const { fullName, username, email, password, educationLevel } = req.body;
    if (!fullName || !username || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const existing = await query("SELECT id FROM users WHERE email = $1 OR username = $2", [email, username]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      "INSERT INTO users (full_name, username, email, password_hash, education_level) VALUES ($1, $2, $3, $4, $5) RETURNING id, full_name, username, email, education_level",
      [fullName, username, email, hashedPassword, educationLevel]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ message: "User registered", token, user });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        username: user.username,
        email: user.email,
        educationLevel: user.education_level
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query("SELECT id, full_name, username, email, education_level, xp, level FROM users WHERE id = $1", [decoded.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    const user = result.rows[0];
    res.json({
      id: user.id,
      fullName: user.full_name,
      username: user.username,
      email: user.email,
      educationLevel: user.education_level,
      xp: user.xp,
      level: user.level
    });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
};