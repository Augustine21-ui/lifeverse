import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables first
dotenv.config();

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
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

// Import migration and database
import { createTables } from "./migrate.js";
import db from "./config/db.js";

console.log('🔵 Imports loaded');

// Create app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
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
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ===== PUBLIC ROUTES (no authentication required) =====

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ✅ DEBUG ENDPOINTS - PUBLIC (no authentication)
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

// ===== API ROUTES =====
app.use("/api/auth", authRoutes);
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

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error details:', err.message);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

// Start server
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