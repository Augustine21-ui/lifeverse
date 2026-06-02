import db from "./db.js";

const userId = 1; // change to your actual user ID
const titles = ["StudySphere", "Challenges", "Opportunities", "Communities", "AI Tutor", "Bridge"];

(async () => {
  for (const title of titles) {
    await db.query("INSERT INTO tasks (user_id, title, xp_reward) VALUES ($1, $2, $3)", [userId, title, 30]);
  }
  console.log("Tasks inserted for user", userId);
  process.exit();
})();
