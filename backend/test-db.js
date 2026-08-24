import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from the backend folder
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('DATABASE_URL:', process.env.DATABASE_URL);

import pool from './src/config/db.js';

pool.query('SELECT 1', (err, res) => {
  if (err) {
    console.error('❌ Connection error:', err.message);
  } else {
    console.log('✅ Connection successful!');
  }
  pool.end();
});