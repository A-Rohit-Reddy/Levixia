/**
 * Diagnosis algorithm for interactive assessment results.
 * Uses Holistic Screening Engine for comprehensive analysis.
 */

import holisticScreeningEngine from '../services/holisticScreeningEngine';

/**
 * @param {Object} results - { reading, spelling, visual, cognitive }
 * @returns {Promise<Object>} report compatible with UserContext.report
 */
export async function computeReportFromResults(results) {
  try {
    // Use holistic screening engine for comprehensive analysis
    const screeningResults = await holisticScreeningEngine.processResults(results);
    
    // Extract LLM-generated report or fallback
    const llmReport = screeningResults.report || {};
    const inference = screeningResults.inference || {
      dyslexiaTypes: ['None identified'],
      adhdIndicators: [],
      primaryType: 'None identified',
      severity: 'Mild',
      confidence: 0.5
    };

    const dyslexiaTypes = inference.dyslexiaTypes || inference.types || [];
    const rawLevel = (inference.severity || inference.severityLevel || llmReport.severityLevel || 'Mild').toLowerCase().replace(/\s+/g, '-');
    const level = ['no-significant-difficulty', 'mild', 'moderate', 'severe'].includes(rawLevel) ? rawLevel : (rawLevel === 'high' ? 'severe' : 'mild');

    const cognitiveIndicators = [
      ...(screeningResults.cognitive?.metrics?.indicators || []),
      ...(screeningResults.visual?.metrics?.indicators || []),
      ...(llmReport.adhdIndicators || inference.adhdIndicators || [])
    ];
    
    // Extract strengths and challenges from LLM report or fallback
    const strengths = llmReport.strengths || ['Willingness to use tools', 'Clear self-awareness'];
    const challenges = llmReport.challenges || [];
    
    // Extract recommendations
    const recommendedFeatures = [];
    if (llmReport.recommendations) {
      llmReport.recommendations.forEach(rec => {
        if (rec.items) {
          recommendedFeatures.push(...rec.items);
        }
      });
    }
    
    // Add default recommendations if none
    if (recommendedFeatures.length === 0) {
      recommendedFeatures.push('Personalized assistant settings');
    }
    
    // Extract raw scores for display
    const reading = results.reading || {};
    const spelling = results.spelling || {};
    const visual = results.visual || {};
    const cognitive = results.cognitive || {};
    
    return {
      dyslexiaTypes,
      cognitiveIndicators: [...new Set(cognitiveIndicators)],
      level,
      strengths: [...new Set(strengths)],
      challenges: challenges.length ? [...new Set(challenges)] : [],
      recommendedFeatures: [...new Set(recommendedFeatures)],
      completed: true,
      _screeningData: screeningResults,
      _llmReport: llmReport,
      _inference: inference,
      _scores: {
        readingAccuracy: reading.accuracyPercent ?? 0,
        spellingAccuracy: spelling.accuracyPercent ?? 0,
        visualAccuracy: visual.accuracy ?? 0,
        cognitiveAccuracy: cognitive.accuracy ?? 0,
        readingWpm: reading.wpm,
        visualTime: visual.timeElapsed,
      },
    };
  } catch (error) {
    console.error('Holistic screening failed, using fallback:', error);
    // Fallback to basic analysis if screening engine fails
    return computeReportFromResultsFallback(results);
  }
}

/**
 * Fallback diagnosis algorithm (rule-based)
 * Used when holistic screening engine is unavailable
 */
function computeReportFromResultsFallback(results) {
  const reading = results.reading || {};
  const spelling = results.spelling || {};
  const visual = results.visual || {};
  const cognitive = results.cognitive || {};

  const readingAccuracy = reading.accuracyPercent ?? 0;
  const spellingAccuracy = spelling.accuracyPercent ?? 0;
  const visualAccuracy = visual.accuracy ?? 0;
  const cognitiveAccuracy = cognitive.accuracy ?? 0;

  const dyslexiaTypes = [];
  const cognitiveIndicators = [];
  const strengths = [];
  const challenges = [];
  const recommendedFeatures = [];

  // Phonological Dyslexia: Spelling < 60% AND Reading < 70%
  if (spellingAccuracy < 60 && readingAccuracy < 70) {
    dyslexiaTypes.push('Phonological');
    challenges.push('Sound-letter linking', 'Decoding and spelling');
    recommendedFeatures.push('Bionic Reading', 'Text-to-speech', 'Phonetic spelling support');
  }

  // Visual / Surface Dyslexia
  const lowVisualAccuracy = visualAccuracy < 60;
  const lowVisualSpeed = visual.timeElapsed != null && visual.timeElapsed > 90;
  if (lowVisualAccuracy || lowVisualSpeed) {
    if (!dyslexiaTypes.includes('Surface')) dyslexiaTypes.push('Surface');
    if (lowVisualAccuracy) cognitiveIndicators.push('Visual stress');
    challenges.push('Visual discrimination', 'Letter/word recognition');
    recommendedFeatures.push('Dyslexia-friendly font', 'Letter and line spacing', 'Focus line highlighting', 'Color & contrast');
  }

  // Working Memory Deficit
  if (cognitiveAccuracy < 60) {
    cognitiveIndicators.push('Working memory difficulty');
    challenges.push('Sequential recall', 'Multi-step tasks');
    recommendedFeatures.push('Cognitive load reduction', 'Chunked text', 'Writing support rules');
  }

  // Mixed if multiple types
  if (dyslexiaTypes.length >= 2) {
    dyslexiaTypes.splice(0, dyslexiaTypes.length, 'Mixed');
  }

  // Default type if none identified
  if (dyslexiaTypes.length === 0 && (readingAccuracy < 80 || spellingAccuracy < 80)) {
    dyslexiaTypes.push('Phonological');
    recommendedFeatures.push('Bionic Reading', 'Text-to-speech');
  }
  if (dyslexiaTypes.length === 0) dyslexiaTypes.push('None identified');

  const weights = { reading: 0.3, spelling: 0.3, visual: 0.2, cognitive: 0.2 };
  const weighted =
    (readingAccuracy / 100) * weights.reading +
    (spellingAccuracy / 100) * weights.spelling +
    (visualAccuracy / 100) * weights.visual +
    (cognitiveAccuracy / 100) * weights.cognitive;
  const deficit = 1 - weighted;
  let level = 'mild';
  if (deficit >= 0.5) level = 'severe';
  else if (deficit >= 0.3) level = 'moderate';
  else if (deficit < 0.15) level = 'no-significant-difficulty';

  if (readingAccuracy >= 75) strengths.push('Reading fluency');
  if (spellingAccuracy >= 75) strengths.push('Spelling accuracy');
  if (visualAccuracy >= 75) strengths.push('Visual discrimination');
  if (cognitiveAccuracy >= 75) strengths.push('Working memory');
  if (strengths.length === 0) strengths.push('Willingness to use tools', 'Clear self-awareness');

  recommendedFeatures.push('Personalized assistant settings');

  return {
    dyslexiaTypes,
    cognitiveIndicators,
    level,
    strengths: [...new Set(strengths)],
    challenges: challenges.length ? [...new Set(challenges)] : [],
    recommendedFeatures: [...new Set(recommendedFeatures)],
    completed: true,
    _llmReport: {
      severityLevel: level === 'severe' ? 'Severe' : level === 'moderate' ? 'Moderate' : level === 'no-significant-difficulty' ? 'No Significant Difficulty' : 'Mild',
      primaryType: dyslexiaTypes[0] || 'None identified',
      disclaimer: 'This report is from a screening and personalization tool only. It is not a medical or clinical diagnosis.',
      recommendProfessionalEvaluation: level === 'severe' || level === 'moderate'
    },
    _scores: {
      readingAccuracy,
      spellingAccuracy,
      visualAccuracy,
      cognitiveAccuracy,
      readingWpm: reading.wpm,
      visualTime: visual.timeElapsed,
    },
  };
}
