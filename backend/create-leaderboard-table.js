import db from './src/config/db.js';

const sql = `
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  leaderboard_type VARCHAR(50) NOT NULL,
  score INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, leaderboard_type)
);
`;

async function run() {
  try {
    await db.query(sql);
    console.log('✅ Leaderboard entries table created successfully.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit();
  }
}

run();