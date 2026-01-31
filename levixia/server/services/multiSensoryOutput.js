/**
 * Multi-Sensory Output Engine
 * Generates text-to-speech metadata, word-by-word highlighting, and correction suggestions
 */

const geminiService = require('./geminiService');

class MultiSensoryOutput {
  /**
   * Generate word-by-word highlighting metadata
   * @param {string} text - Input text
   * @param {Object} config - Highlighting config
   * @returns {Promise<Object>} - Highlighting metadata
   */
  async generateWordHighlighting(text, config = {}) {
    if (!config.enabled) {
      return { words: [], metadata: {} };
    }

    const words = text.split(/\s+/).filter(Boolean);
    const wordMetadata = words.map((word, index) => ({
      index,
      word,
      startTime: index * 0.5, // Estimated timing (can be enhanced with TTS)
      duration: 0.3,
      highlight: false,
      emphasis: false
    }));

    // Use AI to identify important words for highlighting
    if (config.identifyKeywords) {
      try {
        const prompt = `Identify 3-5 most important words in this text for highlighting:

"${text}"

Return JSON with word indices (0-based):
{
  "importantWords": [0, 5, 12],
  "emphasisWords": [2, 8]
}`;

        const result = await geminiService.generateJSON('keyword identification', prompt);
        
        (result.importantWords || []).forEach(idx => {
          if (wordMetadata[idx]) wordMetadata[idx].highlight = true;
        });
        
        (result.emphasisWords || []).forEach(idx => {
          if (wordMetadata[idx]) wordMetadata[idx].emphasis = true;
        });
      } catch (error) {
        console.warn('Keyword identification failed:', error);
      }
    }

    return {
      words: wordMetadata,
      metadata: {
        totalWords: words.length,
        highlightedCount: wordMetadata.filter(w => w.highlight).length,
        emphasisCount: wordMetadata.filter(w => w.emphasis).length
      }
    };
  }

  /**
   * Generate TTS metadata
   * @param {string} text - Input text
   * @param {Object} config - TTS config
   * @returns {Object} - TTS metadata
   */
  generateTTSMetadata(text, config = {}) {
    const words = text.split(/\s+/).filter(Boolean);
    const { rate = 1.0, pitch = 1.0, volume = 1.0 } = config;

    return {
      text,
      words,
      wordCount: words.length,
      estimatedDuration: Math.round((words.length / (rate * 150)) * 60), // seconds
      config: {
        rate,
        pitch,
        volume,
        voice: config.voice || 'default'
      },
      wordTimings: words.map((word, index) => ({
        word,
        index,
        startTime: index * (60 / (rate * 150)),
        duration: (60 / (rate * 150))
      }))
    };
  }

  /**
   * Generate correction suggestions with metadata
   * @param {Array} errors - Error list from analysis
   * @param {Object} config - Suggestion config
   * @returns {Object} - Suggestions with metadata
   */
  generateCorrectionSuggestions(errors, config = {}) {
    const { maxSuggestions = 5, priority = 'all' } = config;

    const suggestions = errors.map((error, index) => ({
      id: `suggestion-${index}`,
      type: error.category || 'unknown',
      original: error.original,
      corrected: error.corrected,
      position: error.position || 0,
      explanation: error.explanation || '',
      confidence: error.confidence || 0.8,
      accepted: false,
      rejected: false
    }));

    // Sort by priority if needed
    if (priority === 'high-confidence') {
      suggestions.sort((a, b) => b.confidence - a.confidence);
    }

    return {
      suggestions: suggestions.slice(0, maxSuggestions),
      totalErrors: errors.length,
      metadata: {
        spellingCount: errors.filter(e => e.category === 'spelling').length,
        grammarCount: errors.filter(e => e.category === 'grammar').length
      }
    };
  }

  /**
   * Generate reading pace metadata
   * @param {string} text - Input text
   * @param {number} wpm - Words per minute
   * @returns {Object} - Pace metadata
   */
  generatePaceMetadata(text, wpm) {
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const estimatedTime = Math.round((wordCount / wpm) * 60); // seconds

    return {
      wordCount,
      wordsPerMinute: wpm,
      estimatedTimeSeconds: estimatedTime,
      estimatedTimeMinutes: Math.round(estimatedTime / 60 * 10) / 10,
      wordsPerSecond: Math.round((wpm / 60) * 10) / 10,
      readingPace: wpm < 100 ? 'slow' : wpm < 150 ? 'moderate' : 'fast'
    };
  }
}

module.exports = new MultiSensoryOutput();
