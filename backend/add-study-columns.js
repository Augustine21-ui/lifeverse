import db from './src/config/db.js';

async function addColumns() {
  try {
    await db.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS current_subject VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS current_topic VARCHAR(255);
    `);
    console.log('✅ Columns "current_subject" and "current_topic" added successfully.');
  } catch (err) {
    console.error('❌ Failed to add columns:', err.message);
  } finally {
    process.exit();
  }
}

addColumns();