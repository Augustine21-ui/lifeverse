import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load with explicit path
dotenv.config({ path: resolve(__dirname, ".env") });

console.log("PORT:", process.env.PORT);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD exists?", !!process.env.DB_PASSWORD);
console.log("DB_PASSWORD value:", process.env.DB_PASSWORD);
