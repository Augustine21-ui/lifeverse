import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import adminRoutes from './routes/adminRoutes.js';
// Load environment variables first
dotenv.config();

// Routes
import authRoutes from './routes/authRoutes.js';       // ✅ ADD THIS
import routes from './routes/index.js';
import tutorRoutes from './routes/tutorRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import personalizeRoutes from './routes/personalizationRoutes.js';
import focusRoutes from './routes/focusRoutes.js';

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
// Public routes first (no authentication)
app.use('/api', authRoutes);        // ✅ MOUNT AUTH ROUTES FIRST

// Protected routes (if any need authentication, they'll handle it themselves)
app.use('/api', routes);
app.use('/api', tutorRoutes);
app.use('/api', quizRoutes);
app.use('/api', taskRoutes);
app.use('/api', uploadRoutes);
app.use('/api', personalizeRoutes);
app.use('/api', focusRoutes);
app.use('/api', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler (should be after all routes)
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});