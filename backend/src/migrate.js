// backend/src/migrate.js
import db from './config/db.js';

export const createTables = async () => {
  console.log('🔧 Running database migrations...');

  // ===== CREATE ALL TABLES =====
  const queries = [
    // ===== CORE TABLES =====
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

    // ===== SOCIAL TABLES =====
    `CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      content TEXT,
      community_id INTEGER,
      likes_count INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      content TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS likes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, post_id)
    )`,

    `CREATE TABLE IF NOT EXISTS post_likes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, post_id)
    )`,

    `CREATE TABLE IF NOT EXISTS announcements (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255),
      content TEXT,
      community_id INTEGER,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS encouragement_wall (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      message TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ===== COMMUNITY TABLES =====
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

    `CREATE TABLE IF NOT EXISTS community_members (
      id SERIAL PRIMARY KEY,
      community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(50) DEFAULT 'member',
      joined_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(community_id, user_id)
    )`,

    `CREATE TABLE IF NOT EXISTS community_events (
      id SERIAL PRIMARY KEY,
      community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
      title VARCHAR(255),
      description TEXT,
      event_date TIMESTAMP,
      location VARCHAR(255),
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS event_rsvps (
      id SERIAL PRIMARY KEY,
      event_id INTEGER REFERENCES community_events(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(50) DEFAULT 'going',
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(event_id, user_id)
    )`,

    // ===== STUDY GROUPS =====
    `CREATE TABLE IF NOT EXISTS study_groups (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      type VARCHAR(50) DEFAULT 'study',
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      member_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS groups (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      type VARCHAR(50) DEFAULT 'study',
      status VARCHAR(50) DEFAULT 'active',
      created_by INTEGER,
      member_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS study_group_members (
      id SERIAL PRIMARY KEY,
      study_group_id INTEGER REFERENCES study_groups(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(50) DEFAULT 'member',
      joined_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(study_group_id, user_id)
    )`,

    `CREATE TABLE IF NOT EXISTS group_members (
      id SERIAL PRIMARY KEY,
      group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(50) DEFAULT 'member',
      joined_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(group_id, user_id)
    )`,

    `CREATE TABLE IF NOT EXISTS group_posts (
      id SERIAL PRIMARY KEY,
      group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      content TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS group_resources (
      id SERIAL PRIMARY KEY,
      group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
      title VARCHAR(255),
      description TEXT,
      url VARCHAR(500),
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS group_focus_sessions (
      id SERIAL PRIMARY KEY,
      group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
      focus_session_id INTEGER REFERENCES focus_sessions(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ===== TASKS =====
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

    `CREATE TABLE IF NOT EXISTS task_quiz_attempts (
      id SERIAL PRIMARY KEY,
      task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      score INTEGER DEFAULT 0,
      total_questions INTEGER DEFAULT 0,
      xp_earned INTEGER DEFAULT 0,
      passed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ===== ACADEMIC TABLES =====
    `CREATE TABLE IF NOT EXISTS countries (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE,
      code VARCHAR(10)
    )`,

    `CREATE TABLE IF NOT EXISTS institutions (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE,
      type VARCHAR(50) DEFAULT 'school',
      country_id INTEGER REFERENCES countries(id),
      subscription_end_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS curricula (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      country_id INTEGER REFERENCES countries(id),
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS subjects (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      curriculum_id INTEGER REFERENCES curricula(id),
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS topics (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      subject_id INTEGER REFERENCES subjects(id),
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

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

    `CREATE TABLE IF NOT EXISTS timetable_entries (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      day_of_week INTEGER,
      start_time TIME,
      end_time TIME,
      subject VARCHAR(255),
      location VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    )`,

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

    `CREATE TABLE IF NOT EXISTS assignments (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255),
      description TEXT,
      due_date TIMESTAMP,
      subject VARCHAR(255),
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS academic_materials (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255),
      description TEXT,
      subject VARCHAR(255),
      url VARCHAR(500),
      uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS academic_feedback (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      subject VARCHAR(255),
      feedback TEXT,
      rating INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS student_academic_info (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      education_level VARCHAR(100),
      institution VARCHAR(255),
      course VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS report_cards (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      subject VARCHAR(255),
      grade VARCHAR(10),
      term VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS reflections (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      content TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ===== GAMIFICATION TABLES =====
    `CREATE TABLE IF NOT EXISTS badges (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE,
      description TEXT,
      icon VARCHAR(255),
      xp_reward INTEGER DEFAULT 50,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS user_badges (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE,
      earned_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, badge_id)
    )`,

    `CREATE TABLE IF NOT EXISTS challenges (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      xp_reward INTEGER DEFAULT 50,
      difficulty VARCHAR(50) DEFAULT 'medium',
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS user_challenges (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
      status VARCHAR(50) DEFAULT 'pending',
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, challenge_id)
    )`,

    `CREATE TABLE IF NOT EXISTS goals (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255),
      description TEXT,
      target_date TIMESTAMP,
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS xp_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER DEFAULT 0,
      source VARCHAR(100),
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS user_mastery (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      subject VARCHAR(255),
      topic VARCHAR(255),
      mastery_level INTEGER DEFAULT 0,
      xp_earned INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ===== ORBIT / LEARNING =====
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

    `CREATE TABLE IF NOT EXISTS orbit_weaknesses (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      subject VARCHAR(255),
      topic VARCHAR(255),
      strength_level INTEGER DEFAULT 0,
      last_encountered TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ===== AI / PERSONALIZATION =====
    `CREATE TABLE IF NOT EXISTS conversations (
      id VARCHAR(255) PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      conversation_id VARCHAR(255) REFERENCES conversations(id) ON DELETE CASCADE,
      role VARCHAR(50),
      content TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS personalized_recommendations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50),
      title VARCHAR(255),
      description TEXT,
      data JSONB,
      is_acted_upon BOOLEAN DEFAULT FALSE,
      generated_at TIMESTAMP DEFAULT NOW(),
      expires_at TIMESTAMP
    )`,

    // ===== BRIDGE / PARENT-TEACHER =====
    `CREATE TABLE IF NOT EXISTS parent_student (
      id SERIAL PRIMARY KEY,
      parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      relationship VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(parent_id, student_id)
    )`,

    `CREATE TABLE IF NOT EXISTS teacher_student (
      id SERIAL PRIMARY KEY,
      teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(teacher_id, student_id)
    )`,

    // ===== SUBSCRIPTIONS =====
    `CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      plan VARCHAR(50),
      status VARCHAR(50),
      start_date TIMESTAMP DEFAULT NOW(),
      end_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS user_subscriptions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      tier VARCHAR(50),
      amount DECIMAL(10,2),
      stripe_payment_id VARCHAR(255),
      status VARCHAR(50) DEFAULT 'inactive',
      is_trial BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ===== QUIZ =====
    `CREATE TABLE IF NOT EXISTS quiz_results (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      quiz_id VARCHAR(255),
      score INTEGER,
      total_questions INTEGER,
      passed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ===== NOTIFICATIONS =====
    `CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50),
      message TEXT,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ===== SUPPORT =====
    `CREATE TABLE IF NOT EXISTS support_requests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      subject VARCHAR(255),
      message TEXT,
      status VARCHAR(50) DEFAULT 'open',
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // ===== SETTINGS =====
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

    // ===== LEADERBOARD =====
    `CREATE TABLE IF NOT EXISTS leaderboard_entries (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      leaderboard_type VARCHAR(50),
      score INTEGER DEFAULT 0,
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, leaderboard_type)
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

  // ===== ADD MISSING COLUMNS =====
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

    // Tasks
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMP`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'medium'`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending'`,

    // Study Groups
    `ALTER TABLE study_groups ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'study'`,
    `ALTER TABLE study_groups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`,
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