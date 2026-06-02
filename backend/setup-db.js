import db from "./db.js";

const createTable = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      full_name VARCHAR(100) NOT NULL,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      education_level VARCHAR(50),
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
  await db.query(queryText);
  console.log("Users table created or already exists");
  process.exit(0);
};

createTable().catch(err => {
  console.error("Error creating table:", err.message);
  process.exit(1);
});
