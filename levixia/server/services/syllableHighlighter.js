/**
 * Syllable Highlighter Service
 * Highlights syllables in words for better readability
 */

const geminiService = require('./geminiService');

class SyllableHighlighter {
  /**
   * Highlight syllables in text
   * @param {string} text - Input text
   * @param {Object} config - Highlighting config
   * @returns {Promise<Object>} - Text with highlighted syllables
   */
  async highlight(text, config = {}) {
    if (!config.enabled) {
      return { highlightedText: text, syllables: [] };
    }

    const prompt = `Break down multi-syllable words in this text into syllables and highlight them.

TEXT:
"${text}"

For each word with 2+ syllables, break it into syllables.
Example: "comprehension" → "com-pre-hen-sion"

Return JSON:
{
  "highlightedText": "Text with syllables highlighted using hyphens",
  "syllables": [
    {
      "word": "comprehension",
      "syllables": ["com", "pre", "hen", "sion"],
      "position": 10
    }
  ]
}`;

    try {
      const result = await geminiService.generateJSON('syllable highlighting', prompt);
      
      // Apply syllable highlighting to text
      let highlightedText = text;
      if (result.syllables && result.syllables.length > 0) {
        result.syllables.forEach(syllable => {
          const syllableString = syllable.syllables.join('-');
          const regex = new RegExp(`\\b${syllable.word}\\b`, 'gi');
          highlightedText = highlightedText.replace(regex, syllableString);
        });
      }

      return {
        highlightedText: highlightedText || text,
        syllables: result.syllables || []
      };
    } catch (error) {
      console.error('Syllable highlighting failed:', error);
      return { highlightedText: text, syllables: [] };
    }
  }
}

module.exports = new SyllableHighlighter();
