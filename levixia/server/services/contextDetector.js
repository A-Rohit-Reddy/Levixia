/**
 * Context Detector
 * Detects task type and user intent from input
 */

const geminiService = require('./geminiService');

class ContextDetector {
  /**
   * Detect task type from input
   * @param {Object} input - { text, inputMode, taskMode, metadata }
   * @returns {Promise<Object>} - Detected context
   */
  async detectContext(input) {
    const { text, inputMode, taskMode, metadata = {} } = input;

    // Quick heuristic detection first
    const quickDetection = this.quickDetect(text, inputMode, taskMode);

    // Use AI for ambiguous cases or to refine
    if (quickDetection.confidence < 0.8 && text.length > 50) {
      try {
        const aiDetection = await this.aiDetect(text, inputMode);
        return {
          ...quickDetection,
          ...aiDetection,
          confidence: Math.max(quickDetection.confidence, aiDetection.confidence || 0.7)
        };
      } catch (error) {
        console.warn('AI context detection failed, using heuristic:', error.message);
        return quickDetection;
      }
    }

    return quickDetection;
  }

  /**
   * Quick heuristic detection
   */
  quickDetect(text, inputMode, taskMode) {
    const textLength = text.length;
    const wordCount = text.split(/\s+/).length;
    const hasQuestions = /[?]/.test(text);
    const hasInstructions = /(steps?|instructions?|how to|guide)/i.test(text);
    const isNarrative = /(story|tale|narrative|chapter)/i.test(text);
    const isAcademic = /(research|study|analysis|thesis|paper)/i.test(text);

    let detectedType = 'reading';
    let confidence = 0.7;

    // Explicit task mode override
    if (taskMode === 'writing' || taskMode === 'mixed') {
      detectedType = taskMode;
      confidence = 0.9;
    }

    // Heuristics
    if (hasQuestions && wordCount > 100) {
      detectedType = 'mixed';
      confidence = 0.8;
    } else if (hasInstructions) {
      detectedType = 'reading';
      confidence = 0.85;
    } else if (isNarrative) {
      detectedType = 'reading';
      confidence = 0.9;
    } else if (isAcademic && wordCount > 500) {
      detectedType = 'reading';
      confidence = 0.85;
    } else if (textLength < 50) {
      detectedType = 'writing';
      confidence = 0.7;
    }

    return {
      taskType: detectedType,
      confidence,
      characteristics: {
        length: textLength < 200 ? 'short' : textLength < 1000 ? 'medium' : 'long',
        complexity: wordCount < 100 ? 'simple' : wordCount < 500 ? 'moderate' : 'complex',
        hasQuestions,
        isNarrative,
        isAcademic
      }
    };
  }

  /**
   * AI-powered context detection
   */
  async aiDetect(text, inputMode) {
    const prompt = `Analyze this text and determine the task type and user intent.

TEXT (first 500 chars):
"${text.substring(0, 500)}"

INPUT MODE: ${inputMode}

Determine:
1. Task type: "reading" | "writing" | "mixed"
2. Confidence (0-1)
3. Characteristics: complexity, purpose, content type

Return JSON:
{
  "taskType": "reading",
  "confidence": 0.85,
  "characteristics": {
    "complexity": "moderate",
    "purpose": "learning",
    "contentType": "narrative"
  }
}`;

    try {
      return await geminiService.generateJSON('context detection', prompt);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Detect reading difficulty level
   * @param {string} text - Input text
   * @returns {Promise<string>} - Difficulty level
   */
  async detectDifficulty(text) {
    const wordCount = text.split(/\s+/).length;
    const avgWordLength = text.split(/\s+/).reduce((sum, w) => sum + w.length, 0) / wordCount;
    const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgSentenceLength = wordCount / sentenceCount;

    // Simple heuristic
    if (avgWordLength > 6 || avgSentenceLength > 20) {
      return 'complex';
    } else if (avgWordLength > 4 || avgSentenceLength > 15) {
      return 'moderate';
    }
    return 'simple';
  }
}

module.exports = new ContextDetector();
