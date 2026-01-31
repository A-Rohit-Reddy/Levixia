/**
 * Spelling Analyzer Module (NLP Pipeline)
 * Analyzes and corrects spelling errors in real-time
 */

const geminiService = require('../geminiService');

class SpellingAnalyzer {
  /**
   * Analyze spelling in text
   * @param {string} text - Input text
   * @param {Object} config - Analysis config
   * @returns {Promise<Object>} - Analysis results
   */
  async analyze(text, config = {}) {
    if (!config.enabled) {
      return { corrected: text, errors: [], suggestions: [] };
    }

    const prompt = `Identify spelling errors in this text and provide corrections.

TEXT:
"${text}"

For each error:
- Identify misspelled word
- Provide correction
- Classify error type (phonetic, visual, typo)
- Suggest alternative if applicable

Return JSON:
{
  "corrected": "text with corrections",
  "errors": [
    {
      "original": "misspelled",
      "corrected": "correct spelling",
      "type": "Phonetic|Visual|Typo",
      "position": 5,
      "confidence": 0.9
    }
  ],
  "suggestions": ["alternative 1", "alternative 2"]
}`;

    try {
      const result = await geminiService.generateJSON('spelling analysis', prompt);
      return {
        corrected: result.corrected || text,
        errors: result.errors || [],
        suggestions: result.suggestions || [],
        errorCount: result.errors?.length || 0
      };
    } catch (error) {
      console.error('Spelling analysis failed:', error);
      return { corrected: text, errors: [], suggestions: [], errorCount: 0 };
    }
  }

  /**
   * Real-time spelling check (for writing mode)
   * @param {string} word - Single word to check
   * @returns {Promise<Object>} - Spelling check result
   */
  async checkWord(word) {
    const prompt = `Check if this word is spelled correctly: "${word}"

If incorrect, provide:
- Correct spelling
- Error type
- Suggestions

Return JSON:
{
  "correct": true|false,
  "corrected": "correct spelling if wrong",
  "errorType": "Phonetic|Visual|Typo|None",
  "suggestions": ["suggestion 1", "suggestion 2"]
}`;

    try {
      return await geminiService.generateJSON('word spelling check', prompt);
    } catch (error) {
      console.error('Word spelling check failed:', error);
      return { correct: true, corrected: word, errorType: 'None', suggestions: [] };
    }
  }
}

module.exports = new SpellingAnalyzer();
