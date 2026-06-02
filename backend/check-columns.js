import db from './db.js';

(async () => {
  try {
    const res = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
    console.log('Columns:', res.rows.map(c => c.column_name));
  } catch (err) {
    console.error(err);
  }
  process.exit();
})();
