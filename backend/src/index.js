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

// Import migration
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
  'http://localhost:5173'  // for local development
];

// If you have a FRONTEND_URL environment variable (like on Render), add it
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
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

// API Routes
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

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ✅ DEBUG ENDPOINT - List all tables in the database
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

// ✅ DEBUG ENDPOINT - Check if a specific table exists
app.get("/api/debug/table/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const result = await db.query(`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as exists
    `, [name]);
    res.json({ 
      table: name, 
      exists: result.rows[0].exists 
    });
  } catch (err) {
    console.error('Debug table error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Global error handler with detailed logging
app.use((err, req, res, next) => {
  console.error('❌ Error details:');
  console.error('  - Message:', err.message);
  console.error('  - Stack:', err.stack);
  console.error('  - URL:', req.url);
  console.error('  - Method:', req.method);
  console.error('  - Body:', req.body);
  
  // Send a detailed error response (only in development)
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(isDev && { 
      stack: err.stack, 
      url: req.url,
      method: req.method
    })
  });
});

// ✅ Wrap startup in an async function with try-catch
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

// Start the server
startServer();