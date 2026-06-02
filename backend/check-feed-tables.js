import db from './db.js';

(async () => {
  const res = await db.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('posts','comments','likes')");
  console.log(res.rows);
  process.exit();
})();
