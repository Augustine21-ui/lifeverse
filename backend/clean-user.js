import db from './db.js';

(async () => {
  try {
    await db.query('DELETE FROM users WHERE email = ', ['alex@lifeverse.com']);
    console.log('User deleted');
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit();
})();
