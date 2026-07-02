import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const res = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='users'`);
console.log(res.rows.map(r => r.column_name));
process.exit();