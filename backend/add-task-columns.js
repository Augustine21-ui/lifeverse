import db from './src/config/db.js';

const sql = `
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder TIMESTAMP;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority BOOLEAN DEFAULT FALSE;
`;

async function run() {
  try {
    await db.query(sql);
    console.log('✅ Task columns added successfully.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit();
  }
}

run();