import db from './src/config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sql = fs.readFileSync(path.join(__dirname, 'migrations', '004_create_academic_tables.sql'), 'utf8');

async function run() {
  try {
    await db.query(sql);
    console.log('✅ Academic tables created successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    process.exit();
  }
}
run();