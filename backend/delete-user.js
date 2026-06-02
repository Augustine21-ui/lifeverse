import db from './db.js';

(async () => {
  await db.query('DELETE FROM users WHERE email = ', ['alex@lifeverse.com']);
  console.log('User deleted');
  process.exit();
})();
