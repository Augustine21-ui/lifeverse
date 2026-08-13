import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

await pool.query(
  'INSERT INTO subscriptions (institution_name, plan) VALUES ($1, $2)',
  ['Thika TTI', 'basic']
);
console.log('✅ Subscription added for Thika TTI');
process.exit();