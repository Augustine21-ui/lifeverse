import db from "./db.js";

const email = "augustine@example.com";
const sql = "SELECT full_name, username, email FROM users WHERE email = $1";
console.log("SQL:", sql);
const res = await db.query(sql, [email]);
console.log("Result:", res.rows);
process.exit();
