/**
 * Text Simplifier Module
 * Simplifies complex text while preserving meaning
 */

const geminiService = require('../geminiService');

class TextSimplifier {
  /**
   * Simplify text based on user profile
   * @param {string} text - Original text
   * @param {Object} config - Simplification config
   * @returns {Promise<Object>} - Simplified text + metadata
   */
  async simplify(text, config = {}) {
    if (!config.enabled) {
      return { simplified: text, changes: [] };
    }

    const { level = 'moderate', preserveMeaning = true } = config;

    const prompt = `Simplify this text for better comprehension. Level: ${level}

ORIGINAL TEXT:
"${text}"

Requirements:
- Preserve core meaning: ${preserveMeaning}
- Simplify vocabulary (use common words)
- Shorten complex sentences
- Keep important information
- Maintain readability

Return JSON:
{
  "simplified": "simplified text here",
  "changes": [
    {
      "original": "complex phrase",
      "simplified": "simple phrase",
      "reason": "vocabulary simplification"
    }
  ],
  "complexityReduction": 0.3
}`;

    try {
      const result = await geminiService.generateJSON('text simplification', prompt);
      return {
        simplified: result.simplified || text,
        changes: result.changes || [],
        complexityReduction: result.complexityReduction || 0
      };
    } catch (error) {
      console.error('Text simplification failed:', error);
      return { simplified: text, changes: [], complexityReduction: 0 };
    }
  }
}

module.exports = new TextSimplifier();
