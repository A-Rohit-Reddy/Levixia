/**
 * Spelling Test Analysis - Backend AI Service
 * Analyzes spelling errors using Gemini
 */

const geminiService = require('./geminiService');

class SpellingAnalysis {
  /**
   * Get word pool for spelling test
   * @returns {Array<string>} - List of words
   */
  getWordPool() {
    return [
      'beautiful', 'necessary', 'because', 'definitely', 'separate',
      'receive', 'believe', 'achieve', 'friend', 'through',
      'though', 'thought', 'enough', 'tough', 'rough'
    ];
  }

  /**
   * Analyze spelling errors
   * @param {Array} spellingResults - Array of { word, typed, accuracy, errorType }
   * @returns {Promise<Object>} - Analysis results
   */
  async analyze(spellingResults) {
    const errors = spellingResults.filter(r => r.accuracy < 100);

    if (errors.length === 0) {
      return {
        errorTypes: [],
        orthographicWeakness: 0,
        phonemeGraphemeMismatch: 0,
        errorClassifications: [],
        feedback: 'Excellent spelling performance!'
      };
    }

    const prompt = `You are an expert in learning disabilities assessment, specifically dyslexia and dysgraphia evaluation.

Analyze these spelling errors:

${JSON.stringify(errors, null, 2)}

Classify each error as:
- Phonetic: Sound-based errors (e.g., "definately" for "definitely")
- Visual: Letter reversals, substitutions (e.g., "beuatiful" for "beautiful")
- Morphological: Word structure errors (e.g., "seperate" for "separate")
- Phoneme-Grapheme: Sound-to-letter mapping issues

Calculate:
1. Orthographic weakness index (0-100, higher = more difficulty with word structure)
2. Phoneme-grapheme mismatch score (0-100, higher = more sound-letter confusion)

Return JSON:
{
  "errorTypes": ["Phonetic", "Visual", etc.],
  "orthographicWeakness": 45,
  "phonemeGraphemeMismatch": 60,
  "errorClassifications": [
    {
      "word": "definitely",
      "attempt": "definately",
      "type": "Phonetic",
      "pattern": "phoneme substitution"
    }
  ],
  "feedback": "Encouraging feedback about spelling patterns"
}`;

    try {
      return await geminiService.generateJSON('spelling analysis', prompt);
    } catch (error) {
      console.error('Spelling analysis failed:', error);
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }
}

module.exports = new SpellingAnalysis();
