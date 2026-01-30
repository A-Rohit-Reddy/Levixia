/**
 * Keyword Highlighter Module
 * Identifies and highlights important keywords
 */

const geminiService = require('../geminiService');

class KeywordHighlighter {
  /**
   * Extract and highlight keywords
   * @param {string} text - Input text
   * @param {Object} config - Highlighting config
   * @returns {Promise<Object>} - Highlighted text + keywords
   */
  async highlight(text, config = {}) {
    if (!config.enabled) {
      return { highlighted: text, keywords: [] };
    }

    const prompt = `Extract important keywords and key phrases from this text.

TEXT:
"${text}"

Identify:
1. Main topic keywords (3-5)
2. Important concepts (2-4)
3. Key phrases that summarize ideas

Return JSON:
{
  "keywords": ["keyword1", "keyword2"],
  "keyPhrases": ["phrase1", "phrase2"],
  "highlightedText": "text with <mark>keywords</mark> highlighted"
}`;

    try {
      const result = await geminiService.generateJSON('keyword extraction', prompt);
      
      // Apply highlighting
      let highlighted = text;
      const keywords = result.keywords || [];
      
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        highlighted = highlighted.replace(regex, `<mark>${keyword}</mark>`);
      });

      return {
        highlighted,
        keywords: result.keywords || [],
        keyPhrases: result.keyPhrases || [],
        metadata: {
          keywordCount: keywords.length,
          highlightCount: (highlighted.match(/<mark>/g) || []).length
        }
      };
    } catch (error) {
      console.error('Keyword highlighting failed:', error);
      return { highlighted: text, keywords: [], keyPhrases: [] };
    }
  }
}

module.exports = new KeywordHighlighter();
