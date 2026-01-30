/**
 * Holistic Report Generation - Backend AI Service
 * Generates comprehensive diagnostic reports using Gemini
 */

const geminiService = require('./geminiService');

class ReportGeneration {
  /**
   * Generate holistic diagnostic report
   * @param {Object} aggregatedResults - Combined results from all tests
   * @returns {Promise<Object>} - Comprehensive report
   */
  async generate(aggregatedResults) {
    const prompt = `You are an expert in learning disabilities assessment. Generate a comprehensive, encouraging, and non-clinical diagnostic report.

ASSESSMENT RESULTS:
${JSON.stringify(aggregatedResults, null, 2)}

Generate a report with:
1. Executive summary (2-3 sentences, encouraging tone)
2. Per-test breakdown (what each test revealed)
3. Strengths (positive aspects)
4. Challenges (areas for support, framed positively)
5. Learning disability likelihood and confidence (if any)
6. Personalized feedback (encouraging, non-diagnostic)
7. Solution recommendations (specific, actionable)

IMPORTANT:
- Use encouraging, non-clinical language
- Do not provide medical diagnoses
- Focus on strengths and support strategies
- Make recommendations specific and actionable
- Keep tone positive and supportive

Return JSON:
{
  "executiveSummary": "Brief encouraging summary",
  "perTestBreakdown": {
    "cognitive": "What cognitive test revealed",
    "visual": "What visual test revealed",
    "reading": "What reading test revealed",
    "spelling": "What spelling test revealed"
  },
  "strengths": ["strength 1", "strength 2"],
  "challenges": ["challenge 1", "challenge 2"],
  "disabilityLikelihood": {
    "type": "Dyslexia|Dysgraphia|ADHD-related|None",
    "severity": "Mild|Moderate|High",
    "confidence": 0.75
  },
  "personalizedFeedback": "Encouraging personalized message",
  "recommendations": [
    {
      "category": "Reading Aids",
      "items": ["recommendation 1", "recommendation 2"]
    },
    {
      "category": "Visual Adjustments",
      "items": ["recommendation 1"]
    },
    {
      "category": "Cognitive Support",
      "items": ["recommendation 1"]
    }
  ]
}`;

    try {
      return await geminiService.generateJSON('holistic report generation', prompt);
    } catch (error) {
      console.error('Report generation failed:', error);
      throw new Error(`AI report generation failed: ${error.message}`);
    }
  }
}

module.exports = new ReportGeneration();
