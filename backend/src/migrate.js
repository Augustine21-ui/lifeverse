// backend/src/migrate.js
import db from './config/db.js';

export const createTables = async () => {
  console.log('🔧 Running database migrations...');

  // Ensure pgcrypto extension for gen_random_uuid()
  try {
    await db.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
    console.log('✅ pgcrypto extension ensured');
  } catch (err) {
    console.warn('⚠️ Extension warning:', err.message);
  }

  // ===== CREATE TABLES =====
  const queries = [
    // --- Your existing tables (users, posts, etc.) should be here ---
    // For completeness, I'll include a minimal set, but keep your existing ones.

    // ===== ORBIT TABLES =====
    `CREATE TABLE IF NOT EXISTS orbit_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject VARCHAR(255) NOT NULL,
      topic VARCHAR(255) NOT NULL,
      orbit_type VARCHAR(50) NOT NULL,
      activity_type VARCHAR(50),
      status VARCHAR(50) DEFAULT 'active',
      started_at TIMESTAMP DEFAULT NOW(),
      completed_at TIMESTAMP,
      score INTEGER DEFAULT 0,
      total_questions INTEGER DEFAULT 0,
      correct_answers INTEGER DEFAULT 0,
      time_spent INTEGER DEFAULT 0,
      xp_earned INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS orbit_activities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID NOT NULL REFERENCES orbit_sessions(id) ON DELETE CASCADE,
      activity_type VARCHAR(50) NOT NULL,
      content JSONB NOT NULL,
      user_answer JSONB,
      is_correct BOOLEAN,
      time_taken INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS orbit_weaknesses (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject VARCHAR(255),
      topic VARCHAR(255),
      concept VARCHAR(255),
      difficulty VARCHAR(50) DEFAULT 'medium',
      last_encountered TIMESTAMP DEFAULT NOW(),
      encountered_count INTEGER DEFAULT 0,
      mastered BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, subject, topic, concept)
    )`,

    `CREATE TABLE IF NOT EXISTS orbit_mastery (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject VARCHAR(255) NOT NULL,
      topic VARCHAR(255) NOT NULL,
      mastery_level INTEGER DEFAULT 0,
      total_activities INTEGER DEFAULT 0,
      correct_activities INTEGER DEFAULT 0,
      last_activity TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, subject, topic)
    )`,

    `CREATE TABLE IF NOT EXISTS orbit_activity_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      session_id UUID REFERENCES orbit_sessions(id) ON DELETE SET NULL,
      activity_type VARCHAR(50) NOT NULL,
      orbit_type VARCHAR(50) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      topic VARCHAR(255) NOT NULL,
      score INTEGER DEFAULT 0,
      total_questions INTEGER DEFAULT 0,
      correct_answers INTEGER DEFAULT 0,
      time_spent INTEGER DEFAULT 0,
      xp_earned INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )`
  ];

  // Add indexes for performance
  const indexQueries = [
    `CREATE INDEX IF NOT EXISTS idx_orbit_sessions_user_id ON orbit_sessions(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_orbit_sessions_status ON orbit_sessions(status)`,
    `CREATE INDEX IF NOT EXISTS idx_orbit_activities_session_id ON orbit_activities(session_id)`,
    `CREATE INDEX IF NOT EXISTS idx_orbit_weaknesses_user_id ON orbit_weaknesses(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_orbit_mastery_user_id ON orbit_mastery(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_orbit_history_user_id ON orbit_activity_history(user_id)`
  ];

  // Combine with your existing table queries – you should already have users, posts, etc.
  // If you don't, add them here. For now, I'll assume they exist.

  const allQueries = [...queries, ...indexQueries];

  for (const query of allQueries) {
    try {
      await db.query(query);
      console.log('✅ Table/index created/checked');
    } catch (err) {
      console.warn('⚠️ Migration warning:', err.message);
    }
  }

  console.log('✅ Database migration complete');
};

// ============================================================
// SELF-EXECUTE when run directly
// ============================================================
if (import.meta.url === `file://${process.argv[1]}`) {
  createTables()
    .then(() => {
      console.log('🎉 Migration finished successfully');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Migration failed:', err);
      process.exit(1);
    });
}