/**
 * Adaptive Assistant Orchestrator
 * Core brain that decides which features to activate and how to process content
 */

const geminiService = require('./geminiService');
const contextDetector = require('./contextDetector');

class AdaptiveAssistant {
  /**
   * Generate adaptive configuration for user
   * @param {Object} userProfile - User learning profile
   * @param {Object} context - Detected context
   * @param {Object} input - User input data
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
      
      console.log(`✅ Adaptive Assistant configured in ${duration}ms`);
      console.log(`🎯 Active Features: ${config.activeFeatures?.join(', ') || 'None'}`);

      // Merge with user profile defaults
      return {
        assistantConfig: {
          ...userProfile.enabledFeatures,
          ...config.assistantConfig,
          smartSpacing: config.assistantConfig?.smartSpacing || {
            enabled: userProfile.enabledFeatures.smartSpacing,
            letterSpacing: 1.1,
            wordSpacing: 1.3,
            lineSpacing: 1.6
          }
        },
        explanation: config.explanation || 'Configuration generated based on your learning profile',
        activeFeatures: config.activeFeatures || [],
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
      // Fallback to profile defaults
      return this.generateFallbackConfig(userProfile, context);
    }
  }

  /**
   * Generate fallback configuration
   */
  generateFallbackConfig(userProfile, context) {
    return {
      assistantConfig: {
        ...userProfile.enabledFeatures,
        smartSpacing: {
          enabled: userProfile.enabledFeatures.smartSpacing,
          letterSpacing: 1.1,
          wordSpacing: 1.3,
          lineSpacing: 1.6
        }
      },
      explanation: 'Using your default learning profile settings',
      activeFeatures: Object.keys(userProfile.enabledFeatures).filter(
        k => userProfile.enabledFeatures[k]
      ),
      recommendedActions: [],
      processingStrategy: {
        simplify: false,
        chunk: userProfile.enabledFeatures.cognitiveLoadReduction,
        highlight: userProfile.readingPreferences.highlightKeywords,
        pace: userProfile.readingPreferences.preferredPace
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
