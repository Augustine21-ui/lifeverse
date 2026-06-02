import db from './db.js';

(async () => {
  const res = await db.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'users'");
  if (res.rows.length === 0) {
    console.log('Users table does NOT exist');
  } else {
    console.log('Users table exists');
    const columns = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
    console.log('Columns:', columns.rows.map(c => c.column_name));
  }
  process.exit();
})();
