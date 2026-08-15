// backend/src/migrate.js
import db from './config/db.js';

export const createTables = async () => {
  console.log('🔧 Running database migrations...');

  // ===== CREATE TABLES =====
  const queries = [
    // Users
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
      trial_used BOOLEAN DEFAULT FALSE,
      stripe_customer_id VARCHAR(255),
      stripe_subscription_id VARCHAR(255),
      avatar_url VARCHAR(255),
      bio TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // Posts
    `CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      content TEXT,
      community_id INTEGER,
      likes_count INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // Comments
    `CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      content TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // Likes
    `CREATE TABLE IF NOT EXISTS likes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, post_id)
    )`,

    // Tasks
    `CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255),
      description TEXT,
      due_date TIMESTAMP,
      priority VARCHAR(50) DEFAULT 'medium',
      status VARCHAR(50) DEFAULT 'pending',
      xp_reward INTEGER DEFAULT 30,
      is_completed BOOLEAN DEFAULT FALSE,
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // Communities
    `CREATE TABLE IF NOT EXISTS communities (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      type VARCHAR(50) DEFAULT 'study',
      member_count INTEGER DEFAULT 0,
      post_count INTEGER DEFAULT 0,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // Community Members
    `CREATE TABLE IF NOT EXISTS community_members (
      id SERIAL PRIMARY KEY,
      community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(50) DEFAULT 'member',
      joined_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(community_id, user_id)
    )`,

    // Orbit Activities
    `CREATE TABLE IF NOT EXISTS orbit_activities (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      subject VARCHAR(255),
      topic VARCHAR(255),
      grade VARCHAR(50),
      activity_type VARCHAR(50),
      content JSONB,
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // Leaderboard Entries
    `CREATE TABLE IF NOT EXISTS leaderboard_entries (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      leaderboard_type VARCHAR(50),
      score INTEGER DEFAULT 0,
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, leaderboard_type)
    )`,

    // User Settings
    `CREATE TABLE IF NOT EXISTS user_settings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      email_notifications BOOLEAN DEFAULT TRUE,
      dark_mode BOOLEAN DEFAULT TRUE,
      language VARCHAR(10) DEFAULT 'en',
      daily_reminder VARCHAR(10) DEFAULT '09:00',
      weekly_report BOOLEAN DEFAULT TRUE,
      push_notifications BOOLEAN DEFAULT TRUE,
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    // Conversations (AI Tutor)
    `CREATE TABLE IF NOT EXISTS conversations (
      id VARCHAR(255) PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    // Messages
    `CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      conversation_id VARCHAR(255) REFERENCES conversations(id) ON DELETE CASCADE,
      role VARCHAR(50),
      content TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // Study Groups
    `CREATE TABLE IF NOT EXISTS study_groups (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      member_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // Groups (alias) – with all columns the controller might query
    `CREATE TABLE IF NOT EXISTS groups (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      type VARCHAR(50) DEFAULT 'study',
      status VARCHAR(50) DEFAULT 'active',
      created_by INTEGER,
      member_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // Study Group Members
    `CREATE TABLE IF NOT EXISTS study_group_members (
      id SERIAL PRIMARY KEY,
      study_group_id INTEGER REFERENCES study_groups(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(50) DEFAULT 'member',
      joined_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(study_group_id, user_id)
    )`,

    // Group Members (for groups)
    `CREATE TABLE IF NOT EXISTS group_members (
      id SERIAL PRIMARY KEY,
      group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(50) DEFAULT 'member',
      joined_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(group_id, user_id)
    )`,

    // Group Focus Sessions
    `CREATE TABLE IF NOT EXISTS group_focus_sessions (
      id SERIAL PRIMARY KEY,
      group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
      focus_session_id INTEGER REFERENCES focus_sessions(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // Academic: Timetable
    `CREATE TABLE IF NOT EXISTS academic_timetable (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      day_of_week INTEGER,
      start_time TIME,
      end_time TIME,
      subject VARCHAR(255),
      location VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // Academic: Assignments
    `CREATE TABLE IF NOT EXISTS academic_assignments (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255),
      description TEXT,
      due_date TIMESTAMP,
      subject VARCHAR(255),
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // Focus Sessions
    `CREATE TABLE IF NOT EXISTS focus_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      topic VARCHAR(255),
      duration INTEGER,
      start_time TIMESTAMP DEFAULT NOW(),
      end_time TIMESTAMP,
      completed BOOLEAN DEFAULT FALSE
    )`,

    // Challenges
    `CREATE TABLE IF NOT EXISTS challenges (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      xp_reward INTEGER DEFAULT 50,
      difficulty VARCHAR(50) DEFAULT 'medium',
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // User Challenges
    `CREATE TABLE IF NOT EXISTS user_challenges (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
      status VARCHAR(50) DEFAULT 'pending',
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, challenge_id)
    )`
  ];

  for (const query of queries) {
    try {
      await db.query(query);
      console.log('✅ Table created/checked');
    } catch (err) {
      console.warn('⚠️ Migration warning:', err.message);
    }
  }

  // ===== ADD MISSING COLUMNS (in case CREATE TABLE didn't include them) =====
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

    // Groups – add missing columns (type, status)
    `ALTER TABLE groups ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'study'`,
    `ALTER TABLE groups ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'`,

    // Tasks – add missing columns (description, due_date, priority, status)
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMP`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'medium'`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending'`,

    // Any other likely missing columns
    `ALTER TABLE study_groups ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'study'`,
  ];

  for (const query of alterQueries) {
    try {
      await db.query(query);
      console.log('✅ Column added/checked');
    } catch (err) {
      console.warn('⚠️ Alter warning:', err.message);
    }
  }

  console.log('✅ Database migration complete');
};