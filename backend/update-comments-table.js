import db from './src/config/db.js';

async function updateCommentsTable() {
  try {
    console.log('📦 Updating comments table...');
    
    await db.query('ALTER TABLE comments ADD COLUMN IF NOT EXISTS community_id INTEGER');
    console.log('✅ Added community_id column');
    
    await db.query('ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id INTEGER');
    console.log('✅ Added parent_id column');
    
    console.log('🎉 Comments table updated successfully!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit();
  }
}

updateCommentsTable();