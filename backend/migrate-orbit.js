import db from './src/config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sql = fs.readFileSync(path.join(__dirname, 'migrations', '003_create_orbit_tables.sql'), 'utf8');

async function run() {
  try {
    await db.query(sql);
    console.log('✅ Orbit tables created successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    process.exit();
  }
}
run();
