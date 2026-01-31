/**
 * Backend Server - Node.js + Express
 * Entry Point
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');

// Import Routes
// Ensure these files exist in your 'routes' folder!
let assistantRoutes, aiRoutes;
try {
  assistantRoutes = require('./routes/assistantRoutes');
  console.log('✅ assistantRoutes loaded');
} catch (error) {
  console.error('❌ Failed to load assistantRoutes:', error.message);
  process.exit(1);
}

try {
  aiRoutes = require('./routes/aiRoutes');
  console.log('✅ aiRoutes loaded');
} catch (error) {
  console.error('❌ Failed to load aiRoutes:', error.message);
  // Don't exit - assistant routes are more critical
} 

const app = express();
const PORT = process.env.PORT || 3001; // Backend on 3001

// 1. ENABLE CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // Allow React Frontend
  credentials: true
}));

// 2. MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. ROUTES (Mounted before app.listen)
// Add logging to verify routes are registered
app.use('/api/assistant', (req, res, next) => {
  console.log(`📡 [${req.method}] ${req.originalUrl}`);
  next();
}, assistantRoutes);

app.use('/api/ai', aiRoutes);

// 4. ROOT ROUTE (Optional: For testing server is up)
app.get('/', (req, res) => {
  res.json({ message: 'Backend server is running!' });
});

// 5. 404 HANDLER (Sends JSON, not HTML)
app.use((req, res, next) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// 6. ERROR HANDLER (Sends JSON errors only)
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  // Always return JSON, never HTML
  res.status(err.status || 500).json({ 
    error: 'Internal server error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 7. START SERVER
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 Frontend should connect to: http://localhost:${PORT}`);
  console.log(`📡 Assistant endpoints available at /api/assistant/*`);
  console.log(`📡 Test endpoint: POST http://localhost:${PORT}/api/assistant/test`);
  console.log(`📡 Speech-to-text: POST http://localhost:${PORT}/api/assistant/speech-to-text`);
  
  if (process.env.MOCK_TRANSCRIPTION === 'true') {
    console.log('⚠️ MOCK MODE ENABLED for Transcription');
  }
  
  // Verify routes are loaded
  console.log('✅ Routes registered successfully');
});

module.exports = app;