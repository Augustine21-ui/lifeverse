import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0`);
console.log('✅ streak_days column added');
process.exit();