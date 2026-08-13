import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import studyGroupRoutes from './routes/studyGroupRoutes.js';
import orbitRoutes from './routes/orbitRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import studyRoutes from './routes/studyRoutes.js';
import academicRoutes from './routes/academicRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import momentumRoutes from './routes/momentumRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

// Load environment variables first
dotenv.config();

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Routes
import authRoutes from './routes/authRoutes.js';
import bridgeRoutes from './routes/bridgeRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import routes from './routes/index.js';
import tutorRoutes from './routes/tutorRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import personalizeRoutes from './routes/personalizationRoutes.js';
import focusRoutes from './routes/focusRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// --- API Routes ---
// Order: public → bridge → other protected → admin (last, at /api/admin)

app.use('/api', authRoutes);              // Public auth (register, login, forgot, reset)
app.use('/api', bridgeRoutes);            // Bridge (parents, teachers, students)
app.use('/api', routes);                  // Dashboard, feed, tasks, etc.
app.use('/api', tutorRoutes);
app.use('/api', quizRoutes);
app.use('/api', taskRoutes);
app.use('/api', uploadRoutes);
app.use('/api', personalizeRoutes);
app.use('/api', focusRoutes);
app.use('/api', leaderboardRoutes);
app.use('/api', studyGroupRoutes);
app.use('/api/orbit', orbitRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/academic', academicRoutes);
app.get('/api/momentum/test', (req, res) => {
  res.json({ message: 'Momentum route is working!' });
});
app.use('/api/momentum', momentumRoutes);      // ← Only once!
app.use('/api/settings', settingsRoutes);     // ← Only once!

// ✅ Admin routes – mounted at /api/admin (last, so they don't interfere)
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});