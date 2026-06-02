import db from './db.js';

(async () => {
  const res = await db.query(\"SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_challenges'\");
  if (res.rows.length === 0) {
    console.log('user_challenges table does NOT exist');
  } else {
    console.log('user_challenges table exists');
    const cols = await db.query(\"SELECT column_name FROM information_schema.columns WHERE table_name = 'user_challenges'\");
    console.log('Columns:', cols.rows.map(c => c.column_name));
  }
  process.exit();
})();
