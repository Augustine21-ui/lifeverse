import db from './src/config/db.js';

async function addColumn() {
  try {
    await db.query(`ALTER TABLE institutions ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'school';`);
    console.log('✅ Column "type" added to institutions.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit();
  }
}

addColumn();