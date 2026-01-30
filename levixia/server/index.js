/**
 * Backend Server - Node.js + Express
 * Handles ALL AI operations via Google Gemini API
 */

// Load environment variables from .env file
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// AI Routes
app.use('/api/ai', aiRoutes);

// Assistant Routes
const assistantRoutes = require('./routes/assistantRoutes');
app.use('/api/assistant', assistantRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 AI endpoints available at /api/ai/*`);
  
  if (!process.env.GOOGLE_API_KEY) {
    console.warn('⚠️  GOOGLE_API_KEY not set. AI features will fail.');
  } else {
    console.log('✅ Google Gemini API key configured');
  }
});

module.exports = app;
