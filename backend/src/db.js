import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env') });

// ✅ Use DATABASE_URL first, fallback to individual env vars
let poolConfig;

if (process.env.DATABASE_URL) {
  // Production – use the full connection string (e.g., from Neon)
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
  console.log('✅ Using DATABASE_URL for PostgreSQL connection');
} else {
  // Local development – use individual env vars
  const password = process.env.DB_PASSWORD ? String(process.env.DB_PASSWORD) : 'postgres';
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: password,
    database: process.env.DB_NAME || 'lifeverse',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
  console.log('ℹ️ Using individual DB env vars (localhost)');
}

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err);
});

export const query = async (text, params) => {
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    console.error('Query error:', err);
    throw err;
  }
};

export default pool;