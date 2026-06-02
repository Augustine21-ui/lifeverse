import db from './db.js';

(async () => {
  try {
    await db.query(\
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        is_completed BOOLEAN DEFAULT FALSE,
        due_date DATE DEFAULT CURRENT_DATE,
        xp_reward INTEGER DEFAULT 30,
        created_at TIMESTAMP DEFAULT NOW()
      )
    \);
    console.log('Tasks table created');
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit();
})();
