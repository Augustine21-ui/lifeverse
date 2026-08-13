import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

await pool.query('DELETE FROM users');
await pool.query('DELETE FROM subscriptions');
console.log('✅ All users and subscriptions deleted');
process.exit();