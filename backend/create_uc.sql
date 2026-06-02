CREATE TABLE IF NOT EXISTS user_challenges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  challenge_id INTEGER,
  status VARCHAR(20) DEFAULT 'pending',
  submission TEXT,
  feedback TEXT,
  xp_awarded INTEGER DEFAULT 0,
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
