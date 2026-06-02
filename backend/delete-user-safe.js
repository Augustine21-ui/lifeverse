import db from './db.js';

const email = 'alex@lifeverse.com';

(async () => {
  try {
    const res = await db.query('DELETE FROM users WHERE email = ', [email]);
    console.log('Deleted', res.rowCount, 'user(s)');
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit();
})();
