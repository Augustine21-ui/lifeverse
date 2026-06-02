import db from './db.js';

(async () => {
  try {
    const res = await db.query('SELECT table_name FROM information_schema.tables WHERE table_schema = ', ['public']);
    console.log('Tables:', res.rows.map(t => t.table_name));
  } catch (err) {
    console.error(err);
  }
  process.exit();
})();
