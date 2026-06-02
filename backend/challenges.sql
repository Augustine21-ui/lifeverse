CREATE TABLE IF NOT EXISTS challenges (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  xp_reward INTEGER DEFAULT 50,
  category VARCHAR(50),
  difficulty VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

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

INSERT INTO challenges (title, description, xp_reward, category, difficulty) VALUES
('Python Basics', 'Complete Python introductory module', 50, 'coding', 'easy'),
('Data Visualization', 'Create a chart using real data', 75, 'data', 'medium'),
('Web Dev Project', 'Build a simple portfolio page', 100, 'web', 'hard');
