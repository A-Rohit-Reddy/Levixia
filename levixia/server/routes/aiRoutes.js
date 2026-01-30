/**
 * AI Routes - Backend API Endpoints
 * All AI operations happen here
 */

const express = require('express');
const router = express.Router();

const cognitiveAnalysis = require('../services/cognitiveAnalysis');
const readingAnalysis = require('../services/readingAnalysis');
const spellingAnalysis = require('../services/spellingAnalysis');
const visualAnalysis = require('../services/visualAnalysis');
const reportGeneration = require('../services/reportGeneration');

/**
 * POST /api/ai/reading-passage
 * Generate reading passage using Gemini
 */
router.post('/reading-passage', async (req, res) => {
  try {
    const { userProfile } = req.body;
    const passage = await readingAnalysis.generatePassage(userProfile || {});
    res.json(passage);
  } catch (error) {
    console.error('Reading passage generation error:', error);
    res.status(500).json({ 
      error: 'AI unavailable – fallback used',
      message: error.message,
      fallback: true
    });
  }
});

/**
 * POST /api/ai/analyze-reading
 * Analyze reading performance using Gemini
 */
router.post('/analyze-reading', async (req, res) => {
  try {
    const { originalText, transcript, timeSeconds } = req.body;
    
    if (!originalText || !transcript) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const analysis = await readingAnalysis.analyze({
      originalText,
      transcript,
      timeSeconds: timeSeconds || 0
    });
    
    res.json(analysis);
  } catch (error) {
    console.error('Reading analysis error:', error);
    res.status(500).json({ 
      error: 'AI unavailable – fallback used',
      message: error.message,
      fallback: true
    });
  }
});

/**
 * POST /api/ai/analyze-spelling
 * Analyze spelling errors using Gemini
 */
router.post('/analyze-spelling', async (req, res) => {
  try {
    const { spellingResults } = req.body;
    
    if (!Array.isArray(spellingResults)) {
      return res.status(400).json({ error: 'spellingResults must be an array' });
    }

    const analysis = await spellingAnalysis.analyze(spellingResults);
    res.json(analysis);
  } catch (error) {
    console.error('Spelling analysis error:', error);
    res.status(500).json({ 
      error: 'AI unavailable – fallback used',
      message: error.message,
      fallback: true
    });
  }
});

/**
 * GET /api/ai/spelling-words
 * Get word pool for spelling test
 */
router.get('/spelling-words', (req, res) => {
  const words = spellingAnalysis.getWordPool();
  res.json({ words });
});

/**
 * POST /api/ai/analyze-visual
 * Analyze visual test performance using Gemini
 */
router.post('/analyze-visual', async (req, res) => {
  try {
    const rawData = req.body;
    
    if (!rawData.target || rawData.hits === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const analysis = await visualAnalysis.analyze(rawData);
    res.json(analysis);
  } catch (error) {
    console.error('Visual analysis error:', error);
    res.status(500).json({ 
      error: 'AI unavailable – fallback used',
      message: error.message,
      fallback: true
    });
  }
});

/**
 * POST /api/ai/analyze-cognitive
 * Analyze cognitive test performance using Gemini
 */
router.post('/analyze-cognitive', async (req, res) => {
  try {
    const rawData = req.body;
    
    if (!rawData.sequence || !rawData.userSequence) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const analysis = await cognitiveAnalysis.analyze(rawData);
    res.json(analysis);
  } catch (error) {
    console.error('Cognitive analysis error:', error);
    res.status(500).json({ 
      error: 'AI unavailable – fallback used',
      message: error.message,
      fallback: true
    });
  }
});

/**
 * POST /api/ai/generate-report
 * Generate holistic diagnostic report using Gemini
 */
router.post('/generate-report', async (req, res) => {
  try {
    const { aggregatedResults } = req.body;
    
    if (!aggregatedResults) {
      return res.status(400).json({ error: 'Missing aggregatedResults' });
    }

    const report = await reportGeneration.generate(aggregatedResults);
    res.json(report);
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ 
      error: 'AI unavailable – fallback used',
      message: error.message,
      fallback: true
    });
  }
});

module.exports = router;
