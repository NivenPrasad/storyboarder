/**
 * =============================================================================
 * INDEX.TS - BACKEND SERVER ENTRY POINT
 * =============================================================================
 *
 * This is where the backend server starts! When you run "npm run dev", this
 * file is executed and creates a server that listens for requests.
 *
 * WHAT IS A SERVER?
 * A server is a program that waits for requests from clients (like your browser)
 * and sends back responses. It's like a waiter at a restaurant - you order
 * (request), they bring your food (response).
 *
 * EXPRESS.JS:
 * We use "Express" - a popular framework that makes building servers easier.
 * It handles the complicated stuff so we can focus on our app's logic.
 *
 * HOW IT WORKS:
 * 1. Browser visits http://localhost:5173 (frontend)
 * 2. Frontend code calls http://localhost:3001/api/storyboards
 * 3. This server receives that request
 * 4. Finds the matching route handler
 * 5. Processes the request (queries database, etc.)
 * 6. Sends back JSON data
 * 7. Frontend displays the data
 */

// Express - The web framework for building the server
import express from 'express';

// CORS - Cross-Origin Resource Sharing
// Allows the frontend (localhost:5173) to talk to backend (localhost:3001)
import cors from 'cors';

// Path - Helper for working with file paths
import path from 'path';

// Database - Our SQLite database instance and initialization function
import db, { initializeDatabase } from './db/database';

// =========================================================================
// IMPORT ROUTE HANDLERS
// =========================================================================
// Each file handles a specific type of resource
// Routes are like departments in a company - each handles its own area

import authRoutes from './routes/auth';           // Login, register, user profile
import storyboardRoutes from './routes/storyboards'; // Storyboard CRUD operations
import sceneRoutes from './routes/scenes';         // Scene CRUD operations
import templateRoutes from './routes/templates';   // Storyboard templates
import commentRoutes from './routes/comments';     // Comments on storyboards/scenes
import exportRoutes from './routes/exports';       // Export to PDF, CSV, etc.
import uploadRoutes from './routes/uploads';       // Image uploads


// =========================================================================
// CREATE THE EXPRESS APPLICATION
// =========================================================================

const app = express();

// Port the server listens on
// process.env.PORT allows deployment platforms to set their own port
const PORT = process.env.PORT || 3001;


// =========================================================================
// INITIALIZE DATABASE
// =========================================================================
// Create tables if they don't exist, add default templates, etc.
initializeDatabase();


// =========================================================================
// MIDDLEWARE
// =========================================================================
// Middleware are functions that run BEFORE your route handlers.
// They can modify requests, check authentication, parse data, etc.

/**
 * CORS MIDDLEWARE
 *
 * By default, browsers block requests from one domain to another (security).
 * CORS tells the browser "it's okay, allow requests from this frontend URL."
 *
 * Without this, the frontend couldn't talk to the backend!
 */
app.use(cors({
  // Which frontend URL is allowed to make requests
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  // Allow cookies and authentication headers
  credentials: true
}));

/**
 * JSON PARSER MIDDLEWARE
 *
 * When the frontend sends JSON data (like { "title": "My Video" }),
 * this middleware automatically parses it into a JavaScript object.
 * The parsed data is available as req.body in route handlers.
 */
app.use(express.json());

/**
 * URL-ENCODED PARSER MIDDLEWARE
 *
 * Parses data from HTML forms (like login forms).
 * "extended: true" allows nested objects.
 */
app.use(express.urlencoded({ extended: true }));

/**
 * STATIC FILE MIDDLEWARE
 *
 * Serves uploaded images from the /uploads folder.
 * When someone requests /uploads/image.jpg, Express sends that file.
 */
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


// =========================================================================
// API ROUTES
// =========================================================================
// Connect each route file to its URL prefix.
// All routes in authRoutes will start with /api/auth
// All routes in storyboardRoutes will start with /api/storyboards
// etc.

app.use('/api/auth', authRoutes);           // /api/auth/login, /api/auth/register, etc.
app.use('/api/storyboards', storyboardRoutes); // /api/storyboards, /api/storyboards/:id, etc.
app.use('/api/scenes', sceneRoutes);         // /api/scenes, /api/scenes/:id, etc.
app.use('/api/templates', templateRoutes);   // /api/templates, etc.
app.use('/api/comments', commentRoutes);     // /api/comments, etc.
app.use('/api/export', exportRoutes);        // /api/export/:id/pdf, etc.
app.use('/api/uploads', uploadRoutes);       // /api/uploads/image, etc.


// =========================================================================
// HEALTH CHECK ENDPOINT
// =========================================================================
/**
 * A simple endpoint that returns "ok" - used to check if the server is running.
 * Useful for monitoring tools and deployment health checks.
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


// =========================================================================
// ERROR HANDLING MIDDLEWARE
// =========================================================================
/**
 * This catches any errors thrown by route handlers.
 * Instead of crashing the server, it sends a nice error response.
 *
 * Must be defined AFTER all routes (order matters in Express!).
 */
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);

  // Handle file upload errors specifically
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.', code: 'FILE_TOO_LARGE' });
    }
    return res.status(400).json({ message: err.message, code: 'UPLOAD_ERROR' });
  }

  // Generic server error
  res.status(500).json({ message: 'Internal server error', code: 'SERVER_ERROR' });
});


// =========================================================================
// START THE SERVER
// =========================================================================
/**
 * app.listen() starts the server and makes it listen for requests.
 * The callback function runs once the server is ready.
 */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});


// =========================================================================
// GRACEFUL SHUTDOWN
// =========================================================================
/**
 * Handle shutdown signals (Ctrl+C, deployment restarts, etc.)
 *
 * When the server needs to stop:
 * 1. Close the database connection properly
 * 2. Exit the process
 *
 * This prevents data corruption and dangling connections.
 */

// SIGINT = Signal Interrupt (Ctrl+C in terminal)
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  db.close(); // Close database connection
  process.exit(0); // Exit successfully
});

// SIGTERM = Signal Terminate (sent by deployment platforms)
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  db.close();
  process.exit(0);
});


// Export the app (useful for testing)
export default app;
