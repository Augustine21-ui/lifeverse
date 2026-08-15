// backend/src/migrate.js
import db from './config/db.js';

export const createTables = async () => {
  const queries = [
    // Users table
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
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // Posts table (for Momentum)
    `CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      content TEXT,
      community_id INTEGER,
      likes_count INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // Comments table
    `CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      content TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // Likes table
    `CREATE TABLE IF NOT EXISTS likes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, post_id)
    )`,

    // Tasks table
    `CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255),
      xp_reward INTEGER DEFAULT 30,
      is_completed BOOLEAN DEFAULT FALSE,
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // Add other tables as needed (communities, orbit_activities, etc.)
  ];

  for (const query of queries) {
    try {
      await db.query(query);
    } catch (err) {
      console.warn('Migration warning:', err.message);
    }
  }
  console.log('✅ Database tables checked/created');
};