import db from './db.js';

(async () => {
  await db.query('DROP TABLE IF EXISTS users CASCADE');
  await db.query(\
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      full_name VARCHAR(100) NOT NULL,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      education_level VARCHAR(50),
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW()
    )
  \);
  console.log('Users table recreated');
  process.exit();
})();
