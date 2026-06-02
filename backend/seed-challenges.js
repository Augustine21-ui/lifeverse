import db from './db.js';

const challenges = [
  ['Python Basics', 'Complete Python introductory module', 50, 'coding', 'easy'],
  ['Data Visualization', 'Create a chart using real data', 75, 'data', 'medium'],
  ['Web Dev Project', 'Build a simple portfolio page', 100, 'web', 'hard']
];

(async () => {
  for (const [title, description, xp, cat, diff] of challenges) {
    await db.query('INSERT INTO challenges (title, description, xp_reward, category, difficulty) VALUES (, , , , )', [title, description, xp, cat, diff]);
  }
  console.log('Sample challenges inserted');
  process.exit();
})();
