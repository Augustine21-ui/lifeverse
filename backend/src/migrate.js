// backend/src/migrate.js
import db from './config/db.js';

export const createTables = async () => {
  console.log('🔧 Running database migrations...');

  const queries = [
    // Users table (with all columns)
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255),
      full_name VARCHAR(255),
      username VARCHAR(100) UNIQUE,
      role VARCHAR(50) DEFAULT 'student',
      institution VARCHAR(255),
      institution_subscription_valid BOOLEAN DEFAULT FALSE,
      subscription_tier VARCHAR(50) DEFAULT 'none',
      subscription_status VARCHAR(50) DEFAULT 'inactive',
      trial_start_date TIMESTAMP,
      trial_end_date TIMESTAMP,
      subscription_end_date TIMESTAMP,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      streak_days INTEGER DEFAULT 0,
      reset_token VARCHAR(255),
      reset_token_expiry TIMESTAMP,
      education_level VARCHAR(100),
      course VARCHAR(255),
      interests TEXT,
      learning_style VARCHAR(50),
      career_goal VARCHAR(255),
      current_subject VARCHAR(255),
      current_topic VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ... (other CREATE TABLE statements)
  ];

  // Run CREATE TABLE queries
  for (const query of queries) {
    try {
      await db.query(query);
    } catch (err) {
      console.warn('⚠️ Migration warning:', err.message);
    }
  }

  // ✅ ADD MISSING COLUMNS (if they don't exist)
  const alterQueries = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS education_level VARCHAR(100)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS course VARCHAR(255)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS interests TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS learning_style VARCHAR(50)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS career_goal VARCHAR(255)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS current_subject VARCHAR(255)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS current_topic VARCHAR(255)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`,
  ];

  for (const query of alterQueries) {
    try {
      await db.query(query);
      console.log('✅ Column added/checked');
    } catch (err) {
      console.warn('⚠️ Alter warning:', err.message);
    }
  }

  console.log('✅ Database tables checked/created and columns updated');
};