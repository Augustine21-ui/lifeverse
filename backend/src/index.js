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

// Create app - ONLY ONCE
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
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
app.use("/api", authRoutes);
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

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

// Start server - ONLY ONCE
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
});
