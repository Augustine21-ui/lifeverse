import pkg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env') });

const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const sql = `
CREATE OR REPLACE FUNCTION generate_conversation_id() RETURNS TEXT AS $$
BEGIN
  RETURN to_char(now(), 'YYYYMMDDHH24MISS') || '-' || substr(md5(random()::text), 1, 8);
END;
$$ LANGUAGE plpgsql;
ALTER TABLE conversations ALTER COLUMN id SET DEFAULT generate_conversation_id();
`;

try {
  await pool.query(sql);
  console.log('✅ Default ID generator added successfully');
} catch (err) {
  console.error('❌ Error:', err.message);
} finally {
  process.exit();
}