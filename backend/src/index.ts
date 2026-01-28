import express from 'express';
import cors from 'cors';
import path from 'path';
import db, { initializeDatabase } from './db/database';

// Import routes
import authRoutes from './routes/auth';
import storyboardRoutes from './routes/storyboards';
import sceneRoutes from './routes/scenes';
import templateRoutes from './routes/templates';
import commentRoutes from './routes/comments';
import exportRoutes from './routes/exports';
import uploadRoutes from './routes/uploads';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
initializeDatabase();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/storyboards', storyboardRoutes);
app.use('/api/scenes', sceneRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/uploads', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.', code: 'FILE_TOO_LARGE' });
    }
    return res.status(400).json({ message: err.message, code: 'UPLOAD_ERROR' });
  }

  res.status(500).json({ message: 'Internal server error', code: 'SERVER_ERROR' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  db.close();
  process.exit(0);
});

export default app;
