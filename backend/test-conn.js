import db from './db.js';

(async () => {
  try {
    const res = await db.query('SELECT 1 as test');
    console.log('✅ Database connection OK:', res.rows);
  } catch (err) {
    console.error('❌ Connection error:', err.message);
  }
  process.exit();
})();
