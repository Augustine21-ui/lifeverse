// backend/src/migrate.js
import db from './config/db.js';

export const createTables = async () => {
  console.log('🔧 Running database migrations...');

  // ===== CREATE TABLES (all tables – keep your existing list here) =====
  // (I'm omitting the full CREATE list for brevity – you already have it.
  //  Make sure it includes the 'groups' table with columns: id, name, description, type, status, milestones, created_by, member_count, created_at, updated_at)
  // If you need the full file again, let me know, but the CREATE part is unchanged from the previous version.

  const queries = [
    // ... (all your existing CREATE TABLE statements)
    // Ensure groups has milestones in its definition:
    `CREATE TABLE IF NOT EXISTS groups (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      type VARCHAR(50) DEFAULT 'study',
      status VARCHAR(50) DEFAULT 'active',
      milestones TEXT,
      created_by INTEGER,
      member_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    // ... all other tables
  ];

  for (const query of queries) {
    try {
      await db.query(query);
      console.log('✅ Table created/checked');
    } catch (err) {
      console.warn('⚠️ Migration warning:', err.message);
    }
  }

  // ===== ADD MISSING COLUMNS (alter) =====
  const alterQueries = [
    // Users
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

    // Groups
    `ALTER TABLE groups ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'study'`,
    `ALTER TABLE groups ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'`,
    `ALTER TABLE groups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`,
    `ALTER TABLE groups ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`,
    // milestones is already in CREATE, but keep this for safety
    `ALTER TABLE groups ADD COLUMN IF NOT EXISTS milestones TEXT`,

    // Tasks
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMP`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'medium'`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending'`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS quiz BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS xp_awarded INTEGER DEFAULT 0`,

    // Study Groups
    `ALTER TABLE study_groups ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'study'`,
    `ALTER TABLE study_groups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`,

    // Timetable / Academic
    `ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS subject_id INTEGER`,
    `ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS institution_id INTEGER`,
    `ALTER TABLE academic_timetable ADD COLUMN IF NOT EXISTS subject_id INTEGER`,
    `ALTER TABLE academic_timetable ADD COLUMN IF NOT EXISTS institution_id INTEGER`,

    // Assignments
    `ALTER TABLE assignments ADD COLUMN IF NOT EXISTS subject_id INTEGER`,
    `ALTER TABLE assignments ADD COLUMN IF NOT EXISTS created_by INTEGER`,

    // Focus Sessions
    `ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP`,
    `ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE`,

    // User Challenges
    `ALTER TABLE user_challenges ADD COLUMN IF NOT EXISTS xp_awarded INTEGER DEFAULT 0`,
    `ALTER TABLE user_challenges ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP`,

    // Challenges
    `ALTER TABLE challenges ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP`,
  ];

  for (const query of alterQueries) {
    try {
      await db.query(query);
      console.log(`✅ Column added/checked: ${query.split(' ')[4]}`);
    } catch (err) {
      console.warn('⚠️ Alter warning:', err.message);
    }
  }

  // ===== FORCE ADD CRITICAL MISSING COLUMNS (extra safety) =====
  const forceQueries = [
    `ALTER TABLE groups ADD COLUMN IF NOT EXISTS milestones TEXT`,
    `ALTER TABLE assignments ADD COLUMN IF NOT EXISTS created_by INTEGER`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS xp_awarded INTEGER DEFAULT 0`,
    `ALTER TABLE user_challenges ADD COLUMN IF NOT EXISTS xp_awarded INTEGER DEFAULT 0`,
    `ALTER TABLE user_challenges ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP`,
    `ALTER TABLE challenges ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP`,
  ];

  for (const query of forceQueries) {
    try {
      await db.query(query);
      console.log(`✅ Forced: ${query.split(' ')[4]} added`);
    } catch (err) {
      console.warn(`⚠️ Force add warning:`, err.message);
    }
  }

  console.log('✅ Database migration complete');
};