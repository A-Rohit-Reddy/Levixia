/**
 * Assistant API Routes
 * Handles all adaptive assistant operations
 */

const express = require('express');
const router = express.Router();

const userProfileEngine = require('../services/userProfileEngine');
const adaptiveAssistant = require('../services/adaptiveAssistant');
const contextDetector = require('../services/contextDetector');
const nlpPipeline = require('../services/nlpPipeline');
const accessibilityEngine = require('../services/accessibilityEngine');
const performanceTracker = require('../services/performanceTracker');
const adaptiveLearningEngine = require('../services/adaptiveLearningEngine');

/**
 * POST /api/assistant/profile
 * Generate or update user learning profile
 */
router.post('/profile', async (req, res) => {
  try {
    const { assessmentResults, report } = req.body;

    if (!assessmentResults || !report) {
      return res.status(400).json({ error: 'Missing assessmentResults or report' });
    }

    console.log('🧠 Generating user learning profile');
    const profile = await userProfileEngine.generateProfile(assessmentResults, report);
    
    res.json(profile);
  } catch (error) {
    console.error('Profile generation error:', error);
    res.status(500).json({ 
      error: 'AI unavailable – fallback used',
      message: error.message,
      fallback: true
    });
  }
});

/**
 * POST /api/assistant/configure
 * Get adaptive configuration for current task
 */
router.post('/configure', async (req, res) => {
  try {
    const { userProfile, input } = req.body;

    if (!userProfile || !input) {
      return res.status(400).json({ error: 'Missing userProfile or input' });
    }

    // Detect context
    const context = await contextDetector.detectContext(input);

    // Generate adaptive configuration
    const config = await adaptiveAssistant.generateConfig(userProfile, context, input);

    res.json(config);
  } catch (error) {
    console.error('Configuration error:', error);
    res.status(500).json({ 
      error: 'AI unavailable – fallback used',
      message: error.message,
      fallback: true
    });
  }
});

/**
 * POST /api/assistant/process
 * Process text with adaptive assistance
 */
router.post('/process', async (req, res) => {
  try {
    const { text, config, userProfile } = req.body;

    if (!text || !config) {
      return res.status(400).json({ error: 'Missing text or config' });
    }

    console.log('🔄 Processing text with adaptive assistance');

    // Process through NLP pipeline
    const nlpResult = await nlpPipeline.process(text, {
      processingStrategy: config.processingStrategy,
      assistantConfig: config.assistantConfig
    });

    // Apply accessibility adaptations
    const accessibilityResult = accessibilityEngine.applyAdaptations(
      nlpResult.processedText,
      {
        ...config.assistantConfig,
        readingPace: config.processingStrategy.pace
      }
    );

    // Generate reading pace info
    const readingPace = accessibilityEngine.generateReadingPace(userProfile || {}, text);

    res.json({
      originalText: text,
      processedText: accessibilityResult.styledText,
      layoutConfig: accessibilityResult.layoutConfig,
      readingPace,
      metadata: {
        ...nlpResult.metadata,
        ...accessibilityResult.metadata
      },
      config: config.assistantConfig,
      activeFeatures: config.activeFeatures || []
    });
  } catch (error) {
    console.error('Text processing error:', error);
    res.status(500).json({ 
      error: 'AI unavailable – fallback used',
      message: error.message,
      fallback: true
    });
  }
});

/**
 * POST /api/assistant/analyze-writing
 * Analyze writing and provide feedback
 */
router.post('/analyze-writing', async (req, res) => {
  try {
    const { userText, referenceText, userProfile } = req.body;

    if (!userText) {
      return res.status(400).json({ error: 'Missing userText' });
    }

    console.log('✍️ Analyzing writing');

    const analysis = await nlpPipeline.analyzeWriting(userText, referenceText);

    res.json({
      ...analysis,
      suggestions: analysis.suggestions || [],
      feedback: generateWritingFeedback(analysis, userProfile)
    });
  } catch (error) {
    console.error('Writing analysis error:', error);
    res.status(500).json({ 
      error: 'AI unavailable – fallback used',
      message: error.message,
      fallback: true
    });
  }
});

/**
 * POST /api/assistant/track-performance
 * Track user performance session
 */
router.post('/track-performance', async (req, res) => {
  try {
    const { sessionType, sessionData } = req.body;

    if (!sessionType || !sessionData) {
      return res.status(400).json({ error: 'Missing sessionType or sessionData' });
    }

    let metrics;
    if (sessionType === 'reading') {
      metrics = performanceTracker.trackReadingSession(sessionData);
    } else if (sessionType === 'writing') {
      metrics = performanceTracker.trackWritingSession(sessionData);
    } else {
      return res.status(400).json({ error: 'Invalid sessionType' });
    }

    res.json(metrics);
  } catch (error) {
    console.error('Performance tracking error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/assistant/update-profile
 * Update user profile based on performance
 */
router.post('/update-profile', async (req, res) => {
  try {
    const { currentProfile, performanceHistory } = req.body;

    if (!currentProfile) {
      return res.status(400).json({ error: 'Missing currentProfile' });
    }

    console.log('🔄 Updating user profile based on performance');

    const updatedProfile = await adaptiveLearningEngine.updateProfile(
      currentProfile,
      performanceHistory || []
    );

    res.json(updatedProfile);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/assistant/trends
 * Get performance trends
 */
router.post('/trends', (req, res) => {
  try {
    const { performanceHistory } = req.body;
    
    if (!performanceHistory) {
      return res.status(400).json({ error: 'Missing performanceHistory' });
    }

    const trends = performanceTracker.analyzeTrends(performanceHistory);

    res.json(trends);
  } catch (error) {
    console.error('Trends analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function
function generateWritingFeedback(analysis, userProfile) {
  if (analysis.accuracy >= 90) {
    return 'Excellent writing! Great job matching the reference.';
  } else if (analysis.accuracy >= 75) {
    return 'Good work! Minor improvements can be made.';
  } else if (analysis.accuracy >= 60) {
    return 'Keep practicing! Focus on accuracy.';
  }
  return 'Take your time and review each word carefully.';
}

module.exports = router;
