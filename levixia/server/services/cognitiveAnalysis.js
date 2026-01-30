/**
 * Cognitive Test Analysis - Backend AI Service
 * Analyzes raw cognitive test data using Gemini
 */

const geminiService = require('./geminiService');

class CognitiveAnalysis {
  /**
   * Analyze cognitive test performance
   * @param {Object} rawData - Raw test data from frontend
   * @returns {Promise<Object>} - Analysis results
   */
  async analyze(rawData) {
    const {
      sequence,
      userSequence,
      responseTimes = [],
      maxLengthReached,
      rounds = [],
      timeElapsed,
      correct,
      total
    } = rawData;

    const prompt = `You are an expert in cognitive assessment and learning disabilities evaluation.

Analyze this cognitive (working memory) test performance:

TEST DATA:
- Sequence shown: [${sequence.join(', ')}]
- User recalled: [${userSequence.join(', ')}]
- Max sequence length reached: ${maxLengthReached}
- Total correct: ${correct} / ${total}
- Time elapsed: ${timeElapsed}s
- Response times (seconds): [${responseTimes.map(t => t.toFixed(2)).join(', ')}]
- Number of rounds: ${rounds.length}

ROUND-BY-ROUND DATA:
${rounds.map((r, i) => `
Round ${i + 1}:
  Sequence length: ${r.sequenceLength}
  Correct: ${r.correct ? 'Yes' : 'No'}
  Correct count: ${r.correctCount || 0} / ${r.sequenceLength}
  Response times: [${(r.responseTimes || []).map(t => t.toFixed(2)).join(', ')}]
`).join('\n')}

Analyze:
1. Working memory capacity (0-100): Based on max length achieved and accuracy
2. Attention stability (0-100): Based on consistency across rounds
3. Task-switching efficiency (0-100): Based on response time consistency
4. Cognitive load sensitivity (0-100): Higher = more difficulty under load
5. Executive function score (0-100): Composite of above
6. Error patterns: transposition, primacy/recency effects, omissions, intrusions
7. Cognitive indicators: specific challenges identified

Return JSON:
{
  "workingMemoryScore": 75,
  "attentionScore": 80,
  "taskSwitchingScore": 70,
  "cognitiveLoadScore": 60,
  "executiveFunctionScore": 71,
  "errorPatterns": ["Transposition", "Omissions"],
  "indicators": ["Working memory difficulty", "Attention span challenges"]
}`;

    try {
      const result = await geminiService.generateJSON('cognitive analysis', prompt);
      
      // Validate and ensure all required fields
      return {
        workingMemoryScore: Math.max(0, Math.min(100, result.workingMemoryScore || 0)),
        attentionScore: Math.max(0, Math.min(100, result.attentionScore || 0)),
        taskSwitchingScore: Math.max(0, Math.min(100, result.taskSwitchingScore || 0)),
        cognitiveLoadScore: Math.max(0, Math.min(100, result.cognitiveLoadScore || 0)),
        executiveFunctionScore: Math.max(0, Math.min(100, result.executiveFunctionScore || 0)),
        errorPatterns: result.errorPatterns || [],
        indicators: result.indicators || []
      };
    } catch (error) {
      console.error('Cognitive analysis failed:', error);
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }
}

module.exports = new CognitiveAnalysis();
