import pkg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env') });

const { Pool } = pkg;
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const sql = `
DO $$
BEGIN
  -- Add role column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='messages' AND column_name='role') THEN
    ALTER TABLE messages ADD COLUMN role TEXT CHECK (role IN ('user', 'assistant', 'system'));
    RAISE NOTICE '✅ role column added to messages';
  ELSE
    RAISE NOTICE '✅ role column already exists';
  END IF;
  
  -- Add conversation_id if missing (in case table exists without it)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='messages' AND column_name='conversation_id') THEN
    ALTER TABLE messages ADD COLUMN conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ conversation_id column added to messages';
  END IF;
END $$;
`;

async function run() {
  try {
    await pool.query(sql);
    console.log('✅ Table fix completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}
run();