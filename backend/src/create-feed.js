import db from './src/db.js';

(async () => {
  await db.query('DROP TABLE IF EXISTS likes CASCADE');
  await db.query('DROP TABLE IF EXISTS comments CASCADE');
  await db.query('DROP TABLE IF EXISTS posts CASCADE');
  
  await db.query('CREATE TABLE posts (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, content TEXT NOT NULL, image_url TEXT, likes_count INTEGER DEFAULT 0, comments_count INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())');
  await db.query('CREATE TABLE comments (id SERIAL PRIMARY KEY, post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, content TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW())');
  await db.query('CREATE TABLE likes (id SERIAL PRIMARY KEY, post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, created_at TIMESTAMP DEFAULT NOW(), UNIQUE(post_id, user_id))');
  console.log('Feed tables recreated');
  process.exit();
})();
