import db from './src/config/db.js';

const sql = `
CREATE TABLE IF NOT EXISTS user_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  dark_mode BOOLEAN DEFAULT TRUE,
  language VARCHAR(10) DEFAULT 'en',
  daily_reminder VARCHAR(10) DEFAULT '09:00',
  weekly_report BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT NOW()
);
`;

async function run() {
  try {
    await db.query(sql);
    console.log('✅ User settings table created successfully.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit();
  }
}

run();