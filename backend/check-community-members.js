import db from './src/config/db.js';

async function checkMembers() {
  try {
    const res = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'community_members'
    `);
    console.log('community_members columns:', res.rows);
    process.exit();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit();
  }
}

checkMembers();