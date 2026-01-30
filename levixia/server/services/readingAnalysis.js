/**
 * Reading Test Analysis - Backend AI Service
 * Generates passages and analyzes reading performance using Gemini
 */

const geminiService = require('./geminiService');

class ReadingAnalysis {
  /**
   * Generate reading passage
   * @param {Object} userProfile - User profile (age, etc.)
   * @returns {Promise<Object>} - Generated passage
   */
  async generatePassage(userProfile = {}) {
    const ageGroup = userProfile.ageGroup || '10-12';

    const prompt = `Generate a 40-60 word reading passage for a ${ageGroup} year old child.
Include phonetic challenges: 'th', 'sh', 'ch', 'ph' sounds.
Make it engaging, story-like, and age-appropriate.

Return JSON:
{
  "text": "the passage text here",
  "difficulty": "Easy|Medium",
  "wordCount": 50,
  "targetPhonemes": ["th", "sh", "ch"]
}`;

    try {
      return await geminiService.generateJSON('reading passage generation', prompt);
    } catch (error) {
      console.error('Passage generation failed:', error);
      // Fallback passage
      return {
        text: "The ship sailed through the shining sea. The captain thought about sharing the treasure with the shore.",
        difficulty: 'Medium',
        wordCount: 22,
        targetPhonemes: ['th', 'sh']
      };
    }
  }

  /**
   * Analyze reading performance
   * @param {Object} data - { originalText, transcript, timeSeconds }
   * @returns {Promise<Object>} - Analysis results
   */
  async analyze(data) {
    const { originalText, transcript, timeSeconds } = data;
    const totalWords = originalText.split(/\s+/).length;
    const wpm = timeSeconds > 0 ? Math.round((totalWords / timeSeconds) * 60) : 0;

    const prompt = `You are an expert in learning disabilities assessment, specifically dyslexia evaluation.

Analyze this child's reading performance:

ORIGINAL TEXT:
"${originalText}"

USER TRANSCRIPT:
"${transcript}"

READING TIME: ${timeSeconds} seconds
WORDS PER MINUTE: ${wpm}

Analyze:
1. Accuracy percentage (word-level and phoneme-level)
2. Error types: phonological (sound-based), visual (letter reversals/skipping), fluency (hesitations/repetitions)
3. Specific error patterns (e.g., "ship" read as "sip" = phonological)
4. Dyslexia indicators
5. Reading fluency assessment

Return JSON:
{
  "accuracyPercent": 85,
  "wpm": ${wpm},
  "errorType": "Phonological|Visual|Fluency|Mixed",
  "errorPatterns": ["specific errors identified"],
  "phonologicalIssues": ["list of specific sound-based errors"],
  "visualIssues": ["list of visual processing errors"],
  "dyslexiaLikelihood": "Low|Moderate|High",
  "strengths": ["what the reader did well"],
  "feedback": "Encouraging, non-clinical feedback"
}`;

    try {
      return await geminiService.generateJSON('reading analysis', prompt);
    } catch (error) {
      console.error('Reading analysis failed:', error);
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }
}

module.exports = new ReadingAnalysis();
