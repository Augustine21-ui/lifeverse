import db from './src/config/db.js';

async function checkPosts() {
  try {
    const res = await db.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'posts'
      )
    `);
    console.log('Posts table exists:', res.rows[0].exists);
    
    if (res.rows[0].exists) {
      const columns = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'posts'
      `);
      console.log('Posts columns:', columns.rows);
    }
    process.exit();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit();
  }
}

checkPosts();