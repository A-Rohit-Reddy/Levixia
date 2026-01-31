/**
 * Writing Feedback Service
 * Analyzes user-written text (no reference) for errors and returns suggestions and ways to overcome
 * Used when user uploads or pastes their own writing for error detection and feedback
 */

const geminiService = require('./geminiService');

class WritingFeedbackService {
  /**
   * Analyze standalone writing: detect errors, suggest corrections, return feedback and ways to overcome
   * @param {string} userText - User's written text
   * @param {Object} userProfile - Optional user learning profile (challenges, writingPreferences)
   * @returns {Promise<Object>} - { errors, suggestions, feedback, waysToOvercome }
   */
  async analyzeStandalone(userText, userProfile = {}) {
    const challenges = (userProfile.challenges || []).join(', ');
    const writingPrefs = userProfile.writingPreferences || {};

    const prompt = `You are an expert writing assistant for users who may have dyslexia or learning differences. Analyze this text for errors and provide supportive feedback.

USER TEXT:
"""
${userText}
"""

${challenges ? `USER'S DETECTED CHALLENGES (from screening): ${challenges}` : ''}

Analyze the text and return JSON with:

1. errors: Array of objects, each with:
   - type: "spelling" | "grammar" | "punctuation" | "word_choice" | "reversal" | "other"
   - original: the incorrect text snippet
   - suggestion: the corrected or improved version
   - message: brief, encouraging explanation (e.g. "Common reversal: 'teh' → 'the'")

2. suggestions: Array of general improvement suggestions (strings), e.g. "Try reading aloud to catch missing words", "Use a spell-checker for tricky words"

3. feedback: A short, encouraging overall feedback paragraph (2-4 sentences). Acknowledge what they did well and mention 1-2 specific areas to practice. Use supportive, non-judgmental language.

4. waysToOvercome: Array of 2-4 concrete strategies to overcome the types of errors found, e.g. "Practice sound-letter patterns for words you often misspell", "Use chunking: write one sentence at a time and reread before continuing"

Return ONLY valid JSON in this exact shape (no markdown, no code blocks):
{
  "errors": [
    { "type": "spelling", "original": "teh", "suggestion": "the", "message": "Letter order mix-up" }
  ],
  "suggestions": ["Suggestion 1", "Suggestion 2"],
  "feedback": "Your overall feedback paragraph here.",
  "waysToOvercome": ["Strategy 1", "Strategy 2"]
}`;

    try {
      const result = await geminiService.generateJSON('standalone writing feedback', prompt);
      return {
        errors: Array.isArray(result.errors) ? result.errors : [],
        suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
        feedback: result.feedback || 'Keep writing! Review the suggestions above to improve.',
        waysToOvercome: Array.isArray(result.waysToOvercome) ? result.waysToOvercome : [],
        accuracy: null
      };
    } catch (error) {
      console.error('Writing feedback service failed:', error);
      return {
        errors: [],
        suggestions: ['Read your text aloud to catch errors.', 'Use a dictionary for words you\'re unsure about.'],
        feedback: 'We couldn\'t run the full analysis right now. Keep practicing and try again.',
        waysToOvercome: ['Practice a little every day.', 'Ask someone to read your draft and give one or two tips.'],
        accuracy: null
      };
    }
  }
}

module.exports = new WritingFeedbackService();
