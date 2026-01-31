/**
 * Adaptive Assistant Orchestrator
 * Core brain that decides which features to activate and how to process content
 * Only activates features that correspond to defects detected in the screening test
 */

const geminiService = require('./geminiService');
const contextDetector = require('./contextDetector');

// Map recommended feature display names to profile feature keys (defect-based only)
const RECOMMENDED_TO_FEATURE = {
  'Bionic Reading': 'bionicReading', 'bionic reading': 'bionicReading',
  'Dyslexia-friendly font': 'dyslexiaFont', 'dyslexia-friendly font': 'dyslexiaFont',
  'Letter and line spacing': 'smartSpacing', 'Letter spacing': 'smartSpacing',
  'Color & contrast': 'smartSpacing', 'Color contrast': 'smartSpacing',
  'Text-to-speech': 'tts', 'text-to-speech': 'tts', 'Phonetic support': 'tts',
  'Writing support': 'writingSupport', 'Writing support rules': 'writingSupport',
  'Spelling suggestions': 'writingSupport', 'Phonetic spelling support': 'writingSupport',
  'Cognitive load reduction': 'cognitiveLoadReduction', 'Chunked text': 'cognitiveLoadReduction',
  'Focus line highlighting': 'focusMode', 'Focus line': 'focusMode',
};

function getDefectBasedFeatures(detectedDefects) {
  if (!detectedDefects || !detectedDefects.recommendedFeatures) return null;
  const allowed = new Set();
  for (const rec of detectedDefects.recommendedFeatures) {
    const key = RECOMMENDED_TO_FEATURE[rec] || RECOMMENDED_TO_FEATURE[(rec || '').toLowerCase()];
    if (key) allowed.add(key);
  }
  return allowed.size ? allowed : null;
}

class AdaptiveAssistant {
  /**
   * Generate adaptive configuration for user (defect-based only: only features from screening report)
   * @param {Object} userProfile - User learning profile
   * @param {Object} context - Detected context
   * @param {Object} input - User input data (may include detectedDefects: { challenges, recommendedFeatures })
   * @returns {Promise<Object>} - Assistant configuration
   */
  async generateConfig(userProfile, context, input) {
    const startTime = Date.now();
    console.log('🧠 Adaptive Assistant reasoning invoked');
    console.log(`📊 User Profile Level: ${userProfile.personalizationLevel}`);
    console.log(`📝 Task Type: ${context.taskType}`);

    const prompt = `You are an intelligent adaptive learning assistant. Generate personalized configuration.

USER PROFILE:
- Enabled Features: ${JSON.stringify(userProfile.enabledFeatures)}
- Reading Preferences: ${JSON.stringify(userProfile.readingPreferences)}
- Writing Preferences: ${JSON.stringify(userProfile.writingPreferences)}
- Attention Profile: ${JSON.stringify(userProfile.attentionProfile)}
- Learning Style: ${JSON.stringify(userProfile.learningStyle)}
- Strengths: ${userProfile.strengths.join(', ')}
- Challenges: ${userProfile.challenges.join(', ')}

CURRENT CONTEXT:
- Task Type: ${context.taskType}
- Text Length: ${input.text?.length || 0} characters
- Characteristics: ${JSON.stringify(context.characteristics || {})}

Generate adaptive configuration:

1. Active Features (only enable what's needed for THIS task):
   - Which features from userProfile.enabledFeatures should be ACTIVE now?
   - Explain why each is enabled/disabled

2. Processing Strategy:
   - How should text be processed?
   - What adaptations are needed?
   - What level of assistance?

3. Recommended Actions:
   - What should the user do next?
   - Any specific guidance?

Return JSON:
{
  "assistantConfig": {
    "bionicReading": true,
    "dyslexiaFont": true,
    "smartSpacing": {
      "enabled": true,
      "letterSpacing": 1.2,
      "wordSpacing": 1.5,
      "lineSpacing": 1.8
    },
    "tts": {
      "enabled": false,
      "reason": "User reading accuracy is good"
    },
    "writingSupport": {
      "enabled": true,
      "level": "moderate"
    },
    "cognitiveLoadReduction": {
      "enabled": true,
      "chunkSize": 6
    },
    "focusMode": false
  },
  "explanation": "Brief explanation of decisions",
  "activeFeatures": ["bionicReading", "smartSpacing", "cognitiveLoadReduction"],
  "recommendedActions": ["Read in chunks", "Take breaks every 15 minutes"],
  "processingStrategy": {
    "simplify": false,
    "chunk": true,
    "highlight": true,
    "pace": 120
  }
}`;

    try {
      const config = await geminiService.generateJSON('adaptive assistant configuration', prompt);
      const duration = Date.now() - startTime;
      
      const defectBased = getDefectBasedFeatures(input.detectedDefects);
      let activeFeatures = config.activeFeatures || [];
      if (defectBased) {
        activeFeatures = activeFeatures.filter(f => defectBased.has(f));
      }

      let assistantConfig = {
        ...userProfile.enabledFeatures,
        ...config.assistantConfig,
        smartSpacing: config.assistantConfig?.smartSpacing || {
          enabled: userProfile.enabledFeatures.smartSpacing,
          letterSpacing: 1.1,
          wordSpacing: 1.3,
          lineSpacing: 1.6
        }
      };
      if (defectBased) {
        const restricted = {};
        for (const key of ['bionicReading', 'dyslexiaFont', 'smartSpacing', 'tts', 'writingSupport', 'cognitiveLoadReduction', 'focusMode']) {
          restricted[key] = defectBased.has(key) && (assistantConfig[key] !== false);
        }
        assistantConfig = { ...assistantConfig, ...restricted };
      }

      console.log(`✅ Adaptive Assistant configured in ${duration}ms`);
      console.log(`🎯 Active Features (defect-based): ${activeFeatures.join(', ') || 'None'}`);

      return {
        assistantConfig,
        explanation: config.explanation || 'Configuration based on your screening results.',
        activeFeatures,
        recommendedActions: config.recommendedActions || [],
        processingStrategy: config.processingStrategy || {
          simplify: false,
          chunk: userProfile.enabledFeatures.cognitiveLoadReduction,
          highlight: userProfile.readingPreferences.highlightKeywords,
          pace: userProfile.readingPreferences.preferredPace
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Adaptive assistant configuration failed:', error);
      return this.generateFallbackConfig(userProfile, context, input);
    }
  }

  /**
   * Generate fallback configuration (defect-based only when detectedDefects provided)
   */
  generateFallbackConfig(userProfile, context, input = {}) {
    const defectBased = getDefectBasedFeatures(input.detectedDefects);
    let activeFeatures = Object.keys(userProfile.enabledFeatures || {}).filter(
      k => userProfile.enabledFeatures[k]
    );
    if (defectBased) {
      activeFeatures = activeFeatures.filter(f => defectBased.has(f));
    }
    const assistantConfig = {
      ...userProfile.enabledFeatures,
      smartSpacing: {
        enabled: userProfile.enabledFeatures?.smartSpacing,
        letterSpacing: 1.1,
        wordSpacing: 1.3,
        lineSpacing: 1.6
      }
    };
    if (defectBased) {
      for (const key of ['bionicReading', 'dyslexiaFont', 'smartSpacing', 'tts', 'writingSupport', 'cognitiveLoadReduction', 'focusMode']) {
        assistantConfig[key] = defectBased.has(key);
      }
    }
    return {
      assistantConfig,
      explanation: 'Using settings based on your screening results.',
      activeFeatures,
      recommendedActions: [],
      processingStrategy: {
        simplify: false,
        chunk: userProfile.enabledFeatures?.cognitiveLoadReduction,
        highlight: userProfile.readingPreferences?.highlightKeywords,
        pace: userProfile.readingPreferences?.preferredPace || 120
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Process content with adaptive configuration
   * @param {string} text - Input text
   * @param {Object} config - Assistant configuration
   * @returns {Promise<Object>} - Processed content
   */
  async processContent(text, config) {
    console.log('🔄 Processing content with adaptive configuration');
    
    // This will be enhanced by NLP pipeline
    return {
      originalText: text,
      processedText: text, // Will be transformed by NLP pipeline
      metadata: {
        wordCount: text.split(/\s+/).length,
        processingApplied: config.activeFeatures || []
      }
    };
  }
}

module.exports = new AdaptiveAssistant();
