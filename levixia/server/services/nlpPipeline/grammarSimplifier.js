/**
 * Grammar Simplifier Module
 * Simplifies complex grammar structures while preserving meaning
 */

const geminiService = require('../geminiService');

class GrammarSimplifier {
  /**
   * Simplify grammar structures
   * @param {string} text - Original text
   * @param {Object} config - Simplification config
   * @returns {Promise<Object>} - Simplified text + metadata
   */
  async simplify(text, config = {}) {
    if (!config.enabled) {
      return { simplified: text, changes: [] };
    }

    const { level = 'moderate', preserveMeaning = true } = config;

    const prompt = `Simplify the grammar and sentence structures in this text for better comprehension.

ORIGINAL TEXT:
"${text}"

Requirements:
- Preserve core meaning: ${preserveMeaning}
- Break complex sentences into shorter ones
- Simplify verb tenses where possible
- Use active voice instead of passive
- Reduce subordinate clauses
- Keep important information

Return JSON:
{
  "simplified": "simplified text here",
  "changes": [
    {
      "original": "complex sentence",
      "simplified": "simple sentence",
      "reason": "sentence structure simplification"
    }
  ],
  "complexityReduction": 0.25
}`;

    try {
      const result = await geminiService.generateJSON('grammar simplification', prompt);
      return {
        simplified: result.simplified || text,
        changes: result.changes || [],
        complexityReduction: result.complexityReduction || 0
      };
    } catch (error) {
      console.error('Grammar simplification failed:', error);
      return { simplified: text, changes: [], complexityReduction: 0 };
    }
  }

  /**
   * Correct grammar errors in user writing
   * @param {string} text - User's text
   * @returns {Promise<Object>} - Corrections and suggestions
   */
  async correctGrammar(text, config = {}) {
    if (!config.enabled) {
      return { corrected: text, errors: [], suggestions: [] };
    }

    const prompt = `Identify and correct grammar errors in this text. Provide suggestions.

TEXT:
"${text}"

For each error, identify:
- Error type (subject-verb agreement, tense, punctuation, etc.)
- Location (word/phrase)
- Correction
- Explanation

Return JSON:
{
  "corrected": "corrected text",
  "errors": [
    {
      "original": "incorrect phrase",
      "corrected": "correct phrase",
      "type": "grammar error type",
      "position": 10,
      "explanation": "brief explanation"
    }
  ],
  "suggestions": ["suggestion 1", "suggestion 2"]
}`;

    try {
      const result = await geminiService.generateJSON('grammar correction', prompt);
      return {
        corrected: result.corrected || text,
        errors: result.errors || [],
        suggestions: result.suggestions || []
      };
    } catch (error) {
      console.error('Grammar correction failed:', error);
      return { corrected: text, errors: [], suggestions: [] };
    }
  }
}

module.exports = new GrammarSimplifier();
