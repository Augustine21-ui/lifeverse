import pkg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const hashed = await bcrypt.hash('Admin123!', 10);
await pool.query(
  'INSERT INTO users (full_name, username, email, password_hash, role, institution) VALUES ($1, $2, $3, $4, $5, $6)',
  ['Super Admin', 'admin', 'admin@lifeverse.com', hashed, 'admin', 'Lifeverse HQ']
);
console.log('✅ Admin created: admin@lifeverse.com / Admin123!');
process.exit();