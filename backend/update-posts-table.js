import db from './src/config/db.js';

async function updatePostsTable() {
  try {
    console.log('📦 Updating posts table...');
    
    await db.query('ALTER TABLE posts ADD COLUMN IF NOT EXISTS community_id INTEGER');
    console.log('✅ Added community_id column');
    
    await db.query("ALTER TABLE posts ADD COLUMN IF NOT EXISTS post_type VARCHAR(20) DEFAULT 'text'");
    console.log('✅ Added post_type column');
    
    await db.query('ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE');
    console.log('✅ Added is_pinned column');
    
    await db.query('ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_announcement BOOLEAN DEFAULT FALSE');
    console.log('✅ Added is_announcement column');
    
    await db.query('ALTER TABLE posts ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0');
    console.log('✅ Added shares_count column');
    
    console.log('🎉 Posts table updated successfully!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit();
  }
}

updatePostsTable();