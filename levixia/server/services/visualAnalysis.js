/**
 * Visual Test Analysis - Backend AI Service
 * Analyzes visual processing test data using Gemini
 */

const geminiService = require('./geminiService');

class VisualAnalysis {
  /**
   * Analyze visual test performance
   * @param {Object} rawData - Raw test data from frontend
   * @returns {Promise<Object>} - Analysis results
   */
  async analyze(rawData) {
    const {
      target,
      hits,
      falsePositives,
      correctCount,
      selectedCount,
      timeElapsed,
      clickPattern = []
    } = rawData;

    const prompt = `You are an expert in learning disabilities assessment, specifically visual processing disorders.

Analyze this visual processing test performance:

TEST DATA:
- Target letter: "${target}"
- Hits (correct selections): ${hits}
- False positives (incorrect selections): ${falsePositives}
- Total correct targets available: ${correctCount}
- Total selected: ${selectedCount}
- Time elapsed: ${timeElapsed}s

CLICK PATTERN:
${clickPattern.map((cp, i) => `
  Click ${i + 1}: ${cp.correct ? 'CORRECT' : 'WRONG'} at ${cp.timeSinceStart}s
`).join('')}

Analyze:
1. Visual stress score (0-100): Based on false positives and time
2. Tracking difficulty index (0-100): Higher = more difficulty tracking targets
3. Pattern recognition efficiency (0-100): Based on accuracy
4. Crowding score (0-100): Visual crowding assessment
5. Symbol discrimination score (0-100): Ability to distinguish similar letters
6. Visual indicators: specific challenges identified

Return JSON:
{
  "visualStressScore": 75,
  "trackingDifficultyIndex": 30,
  "patternRecognitionScore": 80,
  "crowdingScore": 70,
  "discriminationScore": 85,
  "indicators": ["Visual stress", "Line tracking difficulty"]
}`;

    try {
      const result = await geminiService.generateJSON('visual analysis', prompt);
      
      // Validate and ensure all required fields
      return {
        visualStressScore: Math.max(0, Math.min(100, result.visualStressScore || 0)),
        trackingDifficultyIndex: Math.max(0, Math.min(100, result.trackingDifficultyIndex || 0)),
        patternRecognitionScore: Math.max(0, Math.min(100, result.patternRecognitionScore || 0)),
        crowdingScore: Math.max(0, Math.min(100, result.crowdingScore || 0)),
        discriminationScore: Math.max(0, Math.min(100, result.discriminationScore || 0)),
        indicators: result.indicators || []
      };
    } catch (error) {
      console.error('Visual analysis failed:', error);
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }
}

module.exports = new VisualAnalysis();
