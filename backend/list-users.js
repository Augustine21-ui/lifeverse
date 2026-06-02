import db from './db.js';

(async () => {
  const res = await db.query('SELECT id, email, full_name FROM users LIMIT 5');
  console.table(res.rows);
  process.exit();
})();
