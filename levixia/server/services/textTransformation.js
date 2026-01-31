/**
 * Text Transformation Service
 * Transforms text according to user's learning profile using LLM
 */

const geminiService = require('./geminiService');

class TextTransformation {
  /**
   * Transform text based on user profile
   * @param {string} originalText - Original text
   * @param {Object} userProfile - User learning profile
   * @param {Object} report - Assessment report
   * @returns {Promise<Object>} - Transformed text + metadata
   */
  async transform(originalText, userProfile, report) {
    const readingPrefs = userProfile.readingPreferences || {};
    const enabledFeatures = userProfile.enabledFeatures || {};
    const readingGap = report.readingGapAnalysis || {};
    
    const prompt = `Transform this text to make it more accessible and readable based on the user's learning profile.

ORIGINAL TEXT:
"${originalText}"

USER PROFILE:
- Reading Pace: ${readingPrefs.preferredPace || 120} WPM
- Average Time Per Word: ${readingGap.averageTimePerWord || 0.5} seconds
- Reading Gap: ${readingGap.gapPercent || 0}% ${readingGap.gapPercent > 0 ? 'slower' : 'faster'} than average
- Chunk Size: ${readingPrefs.chunkSize || 6} words per chunk
- Enabled Features: ${Object.entries(enabledFeatures).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'None'}

TRANSFORMATION REQUIREMENTS:
1. Simplify sentence structure if cognitive load reduction is enabled
2. Break long sentences into shorter chunks (${readingPrefs.chunkSize || 6} words per chunk)
3. Use simpler vocabulary if reading accuracy < 80%
4. Add spacing between words if smart spacing is enabled
5. Highlight key concepts if keyword highlighting is enabled
6. Adjust complexity based on reading pace (slower pace = simpler text)
7. Maintain original meaning and context
8. Make text dyslexia-friendly (clear structure, avoid confusing words)
9. Increase line spacing for better readability
10. Increase letter spacing if visual stress detected
11. Break into shorter paragraphs (max 3-4 sentences)
12. Highlight syllables in complex words (optional, if syllable highlighting enabled)

DYSLEXIA-FRIENDLY FORMATTING:
- Use increased spacing between letters and words
- Break text into shorter paragraphs
- Use simple, clear vocabulary
- Highlight syllables in multi-syllable words (e.g., "com-pre-hen-sion")
- Use clear sentence structure

Return JSON:
{
  "transformedText": "Transformed text with proper formatting and spacing",
  "originalWordCount": ${originalText.split(/\s+/).length},
  "transformedWordCount": 0,
  "complexityReduction": 0.15,
  "appliedTransformations": ["simplification", "chunking", "spacing", "syllable_highlighting"],
  "keyChanges": [
    {
      "original": "complex phrase",
      "transformed": "simpler phrase",
      "reason": "Simplified for better comprehension"
    }
  ],
  "readingTimeEstimate": {
    "originalSeconds": 0,
    "transformedSeconds": 0,
    "improvementPercent": 0
  },
  "syllableHighlights": [
    {
      "word": "comprehension",
      "syllables": ["com", "pre", "hen", "sion"]
    }
  ]
}`;

    try {
      const result = await geminiService.generateJSON('text transformation', prompt);
      
      // Calculate reading time estimates
      const originalWordCount = originalText.split(/\s+/).length;
      const transformedWordCount = result.transformedText.split(/\s+/).length;
      const avgTimePerWord = readingGap.averageTimePerWord || 0.5;
      
      const originalSeconds = originalWordCount * avgTimePerWord;
      const transformedSeconds = transformedWordCount * avgTimePerWord;
      const improvementPercent = originalSeconds > 0 ? 
        ((originalSeconds - transformedSeconds) / originalSeconds) * 100 : 0;

      return {
        transformedText: result.transformedText || originalText,
        originalWordCount,
        transformedWordCount: transformedWordCount || originalWordCount,
        complexityReduction: result.complexityReduction || 0,
        appliedTransformations: result.appliedTransformations || [],
        keyChanges: result.keyChanges || [],
        readingTimeEstimate: {
          originalSeconds: Math.round(originalSeconds),
          transformedSeconds: Math.round(transformedSeconds),
          improvementPercent: Math.round(improvementPercent * 10) / 10
        }
      };
    } catch (error) {
      console.error('Text transformation failed:', error);
      // Fallback: return original text
      return {
        transformedText: originalText,
        originalWordCount: originalText.split(/\s+/).length,
        transformedWordCount: originalText.split(/\s+/).length,
        complexityReduction: 0,
        appliedTransformations: [],
        keyChanges: [],
        readingTimeEstimate: {
          originalSeconds: 0,
          transformedSeconds: 0,
          improvementPercent: 0
        }
      };
    }
  }
}

module.exports = new TextTransformation();
