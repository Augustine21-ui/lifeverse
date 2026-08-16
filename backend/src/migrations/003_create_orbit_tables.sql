-- Orbit activities (generated content)
CREATE TABLE IF NOT EXISTS orbit_activities (
  id SERIAL PRIMARY KEY,
  subject VARCHAR(100),
  topic VARCHAR(100),
  grade VARCHAR(20),
  activity_type VARCHAR(50),
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  content JSONB NOT NULL,
  correct_answer JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Study sessions
CREATE TABLE IF NOT EXISTS orbit_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(100),
  topic VARCHAR(100),
  start_time TIMESTAMP DEFAULT NOW(),
  end_time TIMESTAMP,
  activities_completed INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  mixup_mode BOOLEAN DEFAULT FALSE
);

-- Student responses
CREATE TABLE IF NOT EXISTS orbit_responses (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES orbit_sessions(id) ON DELETE CASCADE,
  activity_id INTEGER REFERENCES orbit_activities(id),
  user_answer JSONB,
  is_correct BOOLEAN,
  time_spent_seconds INTEGER,
  hint_used BOOLEAN DEFAULT FALSE
);

-- Weakness tracking
CREATE TABLE IF NOT EXISTS orbit_weaknesses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(100),
  topic VARCHAR(100),
  concept VARCHAR(200),
  difficulty_level INTEGER DEFAULT 1,
  last_encountered TIMESTAMP DEFAULT NOW()
);
