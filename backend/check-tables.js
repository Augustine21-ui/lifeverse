import db from './src/config/db.js';

async function checkTables() {
  try {
    // Check if communities table exists
    const res = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%comm%'
    `);
    console.log('Tables found:', res.rows);
    
    // Check if communities table has the right columns
    if (res.rows.length > 0) {
      const columns = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'communities'
      `);
      console.log('Communities columns:', columns.rows);
    }
    
    process.exit();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit();
  }
}

checkTables();