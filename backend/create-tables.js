import db from './db.js';

const createChallengesTable = '
  CREATE TABLE IF NOT EXISTS challenges (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    xp_reward INTEGER DEFAULT 50,
    category VARCHAR(50),
    difficulty VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
  )
';

const createUserChallengesTable = '
  CREATE TABLE IF NOT EXISTS user_challenges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT pending,
    submission TEXT,
    feedback TEXT,
    xp_awarded INTEGER DEFAULT 0,
    submitted_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
  )
';

(async () => {
  await db.query(createChallengesTable);
  console.log('Challenges table ready');
  await db.query(createUserChallengesTable);
  console.log('User challenges table ready');
  process.exit();
})();
