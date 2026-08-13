import db from './src/config/db.js';

const sql = `
CREATE TABLE IF NOT EXISTS user_mastery (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(100),
  topic VARCHAR(100),
  mastery_score FLOAT DEFAULT 0,
  activities_attempted INTEGER DEFAULT 0,
  activities_correct INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, subject, topic)
);
`;

async function run() {
  try {
    await db.query(sql);
    console.log('✅ Table "user_mastery" created successfully.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit();
  }
}

run();