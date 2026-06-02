import db from './db.js';

(async () => {
  await db.query('DELETE FROM users');
  console.log('All users deleted');
  process.exit();
})();
