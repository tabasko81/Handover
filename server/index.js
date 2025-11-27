const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const logRoutes = require('./routes/logs');
const configRoutes = require('./routes/config');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const database = require('./database/db');
const seedUsers = require('./database/seedUsers');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy to get correct IP address (important for Docker/nginx setups)
app.set('trust proxy', true);

// Middleware
// In production, allow requests from the same origin (since frontend and backend are on same port)
// Also allow from the configured FRONTEND_URL if different
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, `http://localhost:${PORT}`] : `http://localhost:${PORT}`)
    : '*', // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Log requests for debugging (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/logs', logRoutes);
app.use('/api/config', configRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // Catch-all handler: send back React's index.html file for any non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
} else {
  // Root route (only in development)
  app.get('/', (req, res) => {
    res.json({ 
      message: 'Shift Handover Log API',
      version: 'alpha.6',
      endpoints: {
        health: '/api/health',
        logs: '/api/logs',
        search: '/api/logs/search?query=your_search_term'
      },
      documentation: 'See README.md for API documentation'
    });
  });
}

// Initialize database
database.initialize().then(() => {
  // Seed default users if they don't exist
  return seedUsers();
}).then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    code: 'SERVER_ERROR',
    message: 'Internal server error',
    details: {}
  });
});

module.exports = app;

