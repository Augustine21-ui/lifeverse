-- ============================================================
-- ORBIT MODULE TABLES
-- ============================================================

-- 1. Orbit Sessions
CREATE TABLE IF NOT EXISTS orbit_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  topic VARCHAR(255) NOT NULL,
  orbit_type VARCHAR(50) NOT NULL, -- cortex, cluepath, pathfinder, reflex
  activity_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active', -- active, completed, abandoned
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  score INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0, -- in seconds
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Orbit Activities
CREATE TABLE IF NOT EXISTS orbit_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES orbit_sessions(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  content JSONB NOT NULL,
  user_answer JSONB,
  is_correct BOOLEAN,
  time_taken INTEGER, -- in seconds
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Orbit Weaknesses (for personalization)
CREATE TABLE IF NOT EXISTS orbit_weaknesses (
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
);

-- 4. Orbit Mastery (overall progress per subject/topic)
CREATE TABLE IF NOT EXISTS orbit_mastery (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  topic VARCHAR(255) NOT NULL,
  mastery_level INTEGER DEFAULT 0, -- 0-100
  total_activities INTEGER DEFAULT 0,
  correct_activities INTEGER DEFAULT 0,
  last_activity TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, subject, topic)
);

-- 5. Orbit Activity History (detailed tracking)
CREATE TABLE IF NOT EXISTS orbit_activity_history (
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
);

-- Indexes for performance
CREATE INDEX idx_orbit_sessions_user_id ON orbit_sessions(user_id);
CREATE INDEX idx_orbit_sessions_status ON orbit_sessions(status);
CREATE INDEX idx_orbit_activities_session_id ON orbit_activities(session_id);
CREATE INDEX idx_orbit_weaknesses_user_id ON orbit_weaknesses(user_id);
CREATE INDEX idx_orbit_mastery_user_id ON orbit_mastery(user_id);
CREATE INDEX idx_orbit_history_user_id ON orbit_activity_history(user_id);

-- ============================================================
-- ADD COLUMNS TO ORBIT_CONTROLLER TABLES (if missing)
-- ============================================================

-- Ensure orbit_activities has all needed columns (if migrating from older version)
ALTER TABLE orbit_activities ADD COLUMN IF NOT EXISTS user_answer JSONB;
ALTER TABLE orbit_activities ADD COLUMN IF NOT EXISTS is_correct BOOLEAN;
ALTER TABLE orbit_activities ADD COLUMN IF NOT EXISTS time_taken INTEGER;