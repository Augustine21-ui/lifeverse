// backend/src/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import compression from "compression"; // optional but recommended

// ─── Security Middleware Imports ──────────────────────────────
import {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  securityHeaders,
  xssProtection,
  ipBlocklist,
  requestLogger,
} from "./middleware/security.js";

import {
  bodySizeLimiter,
  sanitizeQuery,
  preventParamPollution,
} from "./middleware/sanitize.js";

// ─── Load env ───────────────────────────────────────────────────
dotenv.config();

// ─── __dirname in ES Module ──────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Routes ───────────────────────────────────────────────────
import authRoutes from "./routes/authRoutes.js";
import bridgeRoutes from "./routes/bridgeRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import routes from "./routes/index.js";
import tutorRoutes from "./routes/tutorRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import personalizeRoutes from "./routes/personalizationRoutes.js";
import focusRoutes from "./routes/focusRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import studyGroupRoutes from "./routes/studyGroupRoutes.js";
import orbitRoutes from "./routes/orbitRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import studyRoutes from "./routes/studyRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import academicRoutes from "./routes/academicRoutes.js";
import momentumRoutes from "./routes/momentumRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import institutionRoutes from './routes/institutionRoutes.js';

// ─── DB & Migrations ──────────────────────────────────────────
import { createTables } from "./migrate.js";
import db from "./config/db.js";

console.log('🔵 Imports loaded');

// ─── Create App ─────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ─── 1. Compression ───────────────────────────────────────────
app.use(compression());

// ─── 2. Security Headers (Helmet) ─────────────────────────────
app.use(securityHeaders);

// ─── 3. Request Logging ──────────────────────────────────────
app.use(requestLogger);

// ─── 4. IP Blocklist ──────────────────────────────────────────
app.use(ipBlocklist);

// ─── 5. Body Size Limiter ─────────────────────────────────────
app.use(bodySizeLimiter);

// ─── 6. Query String Sanitization ─────────────────────────────
app.use(sanitizeQuery);
app.use(preventParamPollution);

// ─── 7. XSS Protection ────────────────────────────────────────
app.use(xssProtection);

// ─── 8. Global Rate Limiter (all routes) ─────────────────────
app.use(generalLimiter);

// ─── 9. CORS ───────────────────────────────────────────────────
const allowedOrigins = [
  'https://lifeverse-ivory.vercel.app',
  'https://lifeverse-frontend.onrender.com',
  'http://localhost:5173'
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// ─── 10. Body Parsers ──────────────────────────────────────────
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── 11. Static files ──────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ===== PUBLIC ROUTES (no authentication required) =====

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Debug endpoints (public) – you may want to disable these in production
app.get("/api/debug/tables", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    res.json({ 
      tables: result.rows.map(r => r.table_name),
      count: result.rows.length
    });
  } catch (err) {
    console.error('Debug tables error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/debug/table/:name", async (req, res) => {
  try {
    const tableName = req.params.name;
    const existsResult = await db.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      ) as exists
    `, [tableName]);
    const exists = existsResult.rows[0].exists;
    let columns = [];
    if (exists) {
      const columnsResult = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);
      columns = columnsResult.rows;
    }
    res.json({
      table: tableName,
      exists: exists,
      columns: columns,
      message: exists ? `Table '${tableName}' exists with ${columns.length} columns` : `Table '${tableName}' does not exist`
    });
  } catch (err) {
    console.error('Debug table error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ===== API ROUTES – with specific rate limiters where needed =====

// Auth routes – strict limiter
app.use("/api/auth", authLimiter, authRoutes);

// Password reset – even stricter (already applied inside authRoutes if you use the specific endpoints, but we can also apply it here)
// But we'll keep it as above; the authLimiter applies to all auth endpoints.

// Other routes – use the general limiter already applied globally, so no extra needed.
app.use("/api", bridgeRoutes);
app.use("/api", routes);
app.use("/api", tutorRoutes);
app.use("/api", quizRoutes);
app.use("/api", taskRoutes);
app.use("/api", uploadRoutes);
app.use("/api", personalizeRoutes);
app.use("/api", focusRoutes);
app.use("/api", leaderboardRoutes);
app.use("/api", studyGroupRoutes);
app.use("/api/orbit", orbitRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/study", studyRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/academic", academicRoutes);
app.use("/api/momentum", momentumRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/institution', institutionRoutes);

// ─── Global Error Handler ───────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error details:', err.message);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

// ─── Start Server ───────────────────────────────────────────────
const startServer = async () => {
  try {
    console.log('🔵 Running migrations...');
    await createTables();
    console.log('✅ Migrations complete');

    console.log(`🚀 Starting server on port ${PORT}...`);
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error('❌ Fatal error during startup:', error);
    process.exit(1);
  }
};

startServer();