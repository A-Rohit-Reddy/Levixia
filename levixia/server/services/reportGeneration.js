/**
 * Holistic Report Generation - Backend AI Service
 * Exhaustive multimodal screening report: user-friendly, non-medical, with mandatory disclaimer.
 * Output: Detected condition(s), primary dyslexia type or ADHD indicators, severity with confidence,
 * strengths/challenges, recommended assistive features, disclaimer.
 */

const geminiService = require('./geminiService');

class ReportGeneration {
  /**
   * Generate report in mandatory format (non-diagnostic, supportive language)
   * @param {Object} aggregatedResults - Combined results from all tests + inference + severityByDimension
   * @returns {Promise<Object>} - Report with detectedConditions, primaryType, severityLevel, disclaimer
   */
  async generate(aggregatedResults) {
    const inference = aggregatedResults.inference || {};
    const severityByDimension = aggregatedResults.severityByDimension || {};

    const prompt = `You are an expert in learning differences and accessibility. Generate a clear, user-friendly screening report. This is for PERSONALIZATION only—NOT a medical or clinical diagnosis.

ASSESSMENT DATA (all dimensions):
${JSON.stringify(aggregatedResults, null, 2)}

SCREENING DIMENSIONS COVERED:
- Reading & Language: phonological decoding, sight word/irregular word reading, speed, fluency, comprehension
- Writing & Spelling: phonetic patterns, letter reversals, orthographic errors, grammar, fluency
- Visual Processing: crowding sensitivity, line tracking, visual stress
- Auditory Processing: (inferred where applicable from reading/cognitive data)
- Cognitive & Attention: focus duration, task switching, sustained attention, executive function

PRELIMINARY CLASSIFICATION (from engine):
- Dyslexia types considered: ${(inference.dyslexiaTypes || []).join(', ')}
- ADHD indicators: ${(inference.adhdIndicators || []).join(', ') || 'None'}
- Primary type: ${inference.primaryType || 'None'}
- Overall severity: ${inference.severity || 'Mild'}
- Confidence: ${inference.confidence ?? 0.5}
- Severity by dimension: ${JSON.stringify(severityByDimension)}

TASK:
1. Detected Condition(s): List any learning-related patterns suggested by the data (use supportive language; do not diagnose).
2. Primary Dyslexia Type or ADHD Indicators: One primary label (e.g. "Phonological Dyslexia", "ADHD-related indicators", or "None identified").
3. Severity Level: Exactly one of: "No Significant Difficulty", "Mild", "Moderate", "Severe". Include a confidence score (0–1).
4. Key Strengths: 2–4 positive observations.
5. Key Challenges: 2–4 areas for support (framed positively).
6. Recommended Assistive & Accessibility Features: Specific, actionable list (e.g. dyslexia-friendly font, text-to-speech, chunked text).
7. Personalized Feedback: 2–4 sentences, encouraging and non-stigmatizing.
8. Disclaimer: State clearly that this is a screening and personalization tool, not a clinical diagnosis.
9. If severity is Moderate or Severe: Add a short line recommending professional evaluation for anyone who wants a formal assessment.

ETHICAL RULES:
- Do NOT provide medical diagnosis or clinical labels.
- Use supportive, non-stigmatizing language throughout.
- Emphasize personalization and accessibility.
- For high-severity cases, recommend professional evaluation without alarming the user.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "executiveSummary": "2-3 sentence encouraging summary",
  "detectedConditions": ["condition 1", "condition 2"],
  "primaryType": "Phonological Dyslexia | Surface Dyslexia | Rapid Naming Dyslexia | Double Deficit Dyslexia | Visual (Orthographic) Dyslexia | Auditory Dyslexia | Developmental Dyslexia | ADHD-related indicators | None identified",
  "adhdIndicators": ["indicator 1", "indicator 2"],
  "severityLevel": "No Significant Difficulty | Mild | Moderate | Severe",
  "confidenceScore": 0.75,
  "strengths": ["strength 1", "strength 2"],
  "challenges": ["challenge 1", "challenge 2"],
  "perTestBreakdown": {
    "cognitive": "1 sentence",
    "visual": "1 sentence",
    "reading": "1 sentence",
    "spelling": "1 sentence"
  },
  "personalizedFeedback": "Encouraging 2-4 sentences",
  "recommendations": [
    { "category": "Reading Aids", "items": ["item 1"] },
    { "category": "Visual Adjustments", "items": ["item 1"] },
    { "category": "Cognitive Support", "items": ["item 1"] }
  ],
  "disclaimer": "This report is from a screening and personalization tool only. It is not a medical or clinical diagnosis. For diagnosis or treatment, please see a qualified professional.",
  "recommendProfessionalEvaluation": false
}`;

    try {
      const report = await geminiService.generateJSON('holistic report generation', prompt);

      // Ensure mandatory fields and merge with inference/severity from engine
      return {
        executiveSummary: report.executiveSummary || '',
        detectedConditions: Array.isArray(report.detectedConditions) ? report.detectedConditions : (inference.dyslexiaTypes || []).filter(t => t !== 'None identified'),
        primaryType: report.primaryType ?? inference.primaryType ?? 'None identified',
        adhdIndicators: Array.isArray(report.adhdIndicators) ? report.adhdIndicators : (inference.adhdIndicators || []),
        severityLevel: report.severityLevel ?? inference.severity ?? 'Mild',
        confidenceScore: typeof report.confidenceScore === 'number' ? report.confidenceScore : (inference.confidence ?? 0.6),
        strengths: Array.isArray(report.strengths) ? report.strengths : [],
        challenges: Array.isArray(report.challenges) ? report.challenges : [],
        perTestBreakdown: report.perTestBreakdown || {},
        personalizedFeedback: report.personalizedFeedback || '',
        recommendations: Array.isArray(report.recommendations) ? report.recommendations : [],
        disclaimer: report.disclaimer || 'This report is from a screening and personalization tool only. It is not a medical or clinical diagnosis. For diagnosis or treatment, please see a qualified professional.',
        recommendProfessionalEvaluation: report.recommendProfessionalEvaluation === true,
        disabilityLikelihood: inference
      };
    } catch (error) {
      console.error('Report generation failed:', error);
      throw new Error(`AI report generation failed: ${error.message}`);
    }
  }
}

module.exports = new ReportGeneration();
