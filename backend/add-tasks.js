import db from './db.js';

const userId = 1; // Replace with your actual user ID from users table

const tasks = [
  'StudySphere',
  'Challenges',
  'Opportunities',
  'Communities',
  'AI Tutor',
  'Bridge'
];

(async () => {
  for (const title of tasks) {
    await db.query('INSERT INTO tasks (user_id, title, xp_reward) VALUES (, , )', [userId, title, 30]);
  }
  console.log('Tasks added for user', userId);
  process.exit();
})();
