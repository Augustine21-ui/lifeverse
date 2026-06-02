import db from './db.js';

(async () => {
  const tables = ['posts', 'comments', 'likes'];
  for (const table of tables) {
    const res = await db.query("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1)", [table]);
    console.log(`${table}: ${res.rows[0].exists}`);
  }
  process.exit();
})();
