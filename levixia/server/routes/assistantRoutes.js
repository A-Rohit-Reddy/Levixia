/**
 * Assistant API Routes
 * Handles all adaptive assistant operations
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');

// Gracefully import services (with fallback if missing)
// COMMENTED OUT ALL IMPORTS TO PREVENT CRASHES FROM MISSING FILES
// let userProfileEngine, adaptiveAssistant, contextDetector, nlpPipeline;
// let accessibilityEngine, performanceTracker, adaptiveLearningEngine;
// let writingFeedbackService, reverieService;
//
// try {
//   userProfileEngine = require('../services/userProfileEngine');
//   adaptiveAssistant = require('../services/adaptiveAssistant');
//   contextDetector = require('../services/contextDetector');
//   nlpPipeline = require('../services/nlpPipeline');
//   accessibilityEngine = require('../services/accessibilityEngine');
//   performanceTracker = require('../services/performanceTracker');
//   adaptiveLearningEngine = require('../services/adaptiveLearningEngine');
//   writingFeedbackService = require('../services/writingFeedbackService');
//   reverieService = require('../services/reverieService');
// } catch (error) {
//   console.error('Service import failed:', error.message);
// }

// Explicitly set to null since imports are commented out
const userProfileEngine = null;
const adaptiveAssistant = null;
const contextDetector = null;
const nlpPipeline = null;
const accessibilityEngine = null;
const performanceTracker = null;
const adaptiveLearningEngine = null;
const writingFeedbackService = null;

// IMPORTANT: Load reverieService for real transcription
let reverieService = null;
try {
  reverieService = require('../services/reverieService');
  console.log('✅ ReverieService loaded successfully');
} catch (error) {
  console.error('❌ ReverieService failed to load:', error.message);
  console.error('Stack:', error.stack);
  console.warn('⚠️ Will use mock mode if MOCK_TRANSCRIPTION is enabled');
}

// Multer config for file uploads (memory storage for buffers)
// Make it permissive - accept any file or no file
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept any file type for now (permissive)
    cb(null, true);
  }
});

// Test route to verify routing works
router.post('/test', (req, res) => {
  console.log('✅ /api/assistant/test was hit!');
  res.json({ 
    message: 'Test route works!', 
    received: req.body,
    timestamp: new Date().toISOString()
  });
});

// Speech-to-Text Endpoint (Uses real Reverie API, falls back to mock if unavailable)
router.post('/speech-to-text', upload.single('audio'), async (req, res) => {
  try {
    console.log('✅ POST /api/assistant/speech-to-text was hit!');
    console.log('📦 Request body:', req.body);
    console.log('📦 File received:', req.file ? `${req.file.size} bytes, type: ${req.file.mimetype}` : 'No file');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { language = 'en' } = req.body;
    
    // Check if we should use mock mode
    const mockEnabled = process.env.MOCK_TRANSCRIPTION === 'true';
    const serviceAvailable = reverieService !== null;
    
    console.log(`📊 Transcription mode check: mockEnabled=${mockEnabled}, serviceAvailable=${serviceAvailable}`);
    
    // Use real Reverie API if available and mock is disabled
    if (serviceAvailable && !mockEnabled) {
      try {
        console.log('🎤 Transcribing with REAL Reverie API...');
        console.log(`📦 Audio buffer: ${req.file.buffer.length} bytes, type: ${req.file.mimetype}`);
        
        const result = await reverieService.transcribeAudio(req.file.buffer, language);
        
        if (!result || !result.transcript) {
          throw new Error('Empty transcript from Reverie API');
        }
        
        console.log('✅ Transcription successful!');
        console.log(`📝 Transcript (first 100 chars): ${result.transcript.substring(0, 100)}...`);
        console.log(`📊 Transcript length: ${result.transcript.length} characters`);
        
        return res.json({
          success: true,
          transcript: result.transcript,
          confidence: result.confidence,
          rawResponse: result.rawResponse,
          fileReceived: {
            size: req.file.size,
            mimetype: req.file.mimetype
          }
        });
      } catch (apiError) {
        console.error('❌ Reverie API call failed:', apiError.message);
        console.error('Stack:', apiError.stack);
        // Fall through to mock mode on error
        console.warn('⚠️ Falling back to mock mode due to API error');
      }
    }
    
    // Fallback to mock mode
    console.log('⚠️ Using MOCK transcription');
    console.log(`   Reason: mockEnabled=${mockEnabled}, serviceAvailable=${serviceAvailable}`);
    
    // Mock response - WARNING: This will give inaccurate accuracy results!
    const mockTranscript = 'This is a mock transcription response for testing. The ship sailed across the ocean. The captain shared the treasure.';
    
    return res.json({
      success: true,
      transcript: mockTranscript,
      confidence: 0.95,
      rawResponse: { mock: true },
      fileReceived: {
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      warning: '⚠️ MOCK MODE: Accuracy will NOT reflect your actual reading. Enable real API by setting MOCK_TRANSCRIPTION=false and ensuring ReverieService loads correctly.'
    });
  } catch (error) {
    console.error('Speech-to-text error:', error);
    res.status(500).json({ 
      error: 'Speech-to-text failed',
      message: error.message
    });
  }
});

/**
 * POST /api/assistant/optimize-font-size
 * Calculate reading accuracy and determine if font size needs to increase
 * Returns accuracy percentage and recommendation
 */
router.post('/optimize-font-size', async (req, res) => {
  try {
    const { originalText, transcribedText, currentFontSize = 16, fontSizeIncrement = 2 } = req.body;

    if (!originalText || !transcribedText) {
      return res.status(400).json({ error: 'Missing originalText or transcribedText' });
    }

    console.log('📊 Font size optimization request:');
    console.log(`   Original text length: ${originalText.length} chars`);
    console.log(`   Transcribed text length: ${transcribedText.length} chars`);
    console.log(`   Original (first 50): "${originalText.substring(0, 50)}..."`);
    console.log(`   Transcribed (first 50): "${transcribedText.substring(0, 50)}..."`);

    // Calculate match percentage using simple word matching
    const normalize = (text) => 
      text.toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(w => w.length > 0);

    const originalWords = normalize(originalText);
    const transcribedWords = normalize(transcribedText);

    console.log(`   Original words: ${originalWords.length}`);
    console.log(`   Transcribed words: ${transcribedWords.length}`);

    if (originalWords.length === 0) {
      return res.status(400).json({ error: 'Original text is empty' });
    }

    // Calculate word-level accuracy
    let matches = 0;
    const minLength = Math.min(originalWords.length, transcribedWords.length);
    
    for (let i = 0; i < minLength; i++) {
      if (originalWords[i] === transcribedWords[i]) {
        matches++;
      }
    }

    const matchPercent = (matches / originalWords.length) * 100;
    const accuracyThreshold = 70;
    
    console.log(`   Exact matches: ${matches}/${originalWords.length}`);
    console.log(`   Match percentage: ${matchPercent.toFixed(2)}%`);
    
    // Determine if threshold is reached
    const thresholdReached = matchPercent >= accuracyThreshold;
    
    // Calculate next font size
    let nextFontSize = currentFontSize;
    let shouldIncrease = false;
    
    if (!thresholdReached) {
      // Below threshold - increase font size
      nextFontSize = currentFontSize + fontSizeIncrement;
      shouldIncrease = true;
    } else {
      // Threshold reached - current size is optimal
      nextFontSize = currentFontSize;
    }

    // Check if threshold was reached in normal font range (16-20px)
    const normalFontMax = 16 + (2 * fontSizeIncrement); // 20px
    const reachedInNormalRange = thresholdReached && currentFontSize <= normalFontMax;

    const result = {
      matchPercent: Math.round(matchPercent * 100) / 100,
      thresholdReached,
      currentFontSize,
      nextFontSize,
      shouldIncrease,
      reachedInNormalRange,
      optimalFontSize: thresholdReached ? currentFontSize : null,
      recommendation: reachedInNormalRange 
        ? 'reading_assistant_not_needed' 
        : thresholdReached 
          ? 'font_size_optimal' 
          : 'increase_font_size',
      debug: {
        originalWordCount: originalWords.length,
        transcribedWordCount: transcribedWords.length,
        exactMatches: matches
      }
    };

    console.log(`✅ Optimization result: ${result.matchPercent}% accuracy, threshold reached: ${thresholdReached}`);

    res.json(result);
  } catch (error) {
    console.error('Font size optimization error:', error);
    res.status(500).json({ 
      error: 'Font size optimization failed',
      message: error.message
    });
  }
});

// ... (Keep other routes as-is, but they may need similar mocking if they rely on missing services)

module.exports = router;