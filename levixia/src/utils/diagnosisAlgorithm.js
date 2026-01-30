/**
 * Diagnosis algorithm for interactive assessment results.
 * Analyzes aggregate data to flag dyslexia types and severity.
 */

/**
 * @param {Object} results - { reading, spelling, visual, cognitive }
 * @returns {Object} report compatible with UserContext.report
 */
export function computeReportFromResults(results) {
  const reading = results.reading || {};
  const spelling = results.spelling || {};
  const visual = results.visual || {};
  const cognitive = results.cognitive || {};

  const readingAccuracy = reading.accuracyPercent ?? 0;
  const spellingAccuracy = spelling.accuracyPercent ?? 0;
  const visualAccuracy = visual.accuracy ?? 0;
  const visualSpeed = visual.timeElapsed != null ? 1 / (visual.timeElapsed / 60 || 0.1) : 0; // rough "speed" inverse of time
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

  // Visual / Surface Dyslexia: Low visual processing speed or low visual discrimination
  const lowVisualAccuracy = visualAccuracy < 60;
  const lowVisualSpeed = visual.timeElapsed != null && visual.timeElapsed > 90; // slow > 90s
  if (lowVisualAccuracy || lowVisualSpeed) {
    if (!dyslexiaTypes.includes('Surface')) dyslexiaTypes.push('Surface');
    if (lowVisualAccuracy) cognitiveIndicators.push('Visual stress');
    challenges.push('Visual discrimination', 'Letter/word recognition');
    recommendedFeatures.push('Dyslexia-friendly font', 'Letter and line spacing', 'Focus line highlighting', 'Color & contrast');
  }

  // Working Memory Deficit: Low cognitive test score
  if (cognitiveAccuracy < 60) {
    cognitiveIndicators.push('Working memory difficulty');
    challenges.push('Sequential recall', 'Multi-step tasks');
    recommendedFeatures.push('Cognitive load reduction', 'Chunked text', 'Writing support rules');
  }

  // Mixed if multiple types
  if (dyslexiaTypes.length >= 2) {
    const mixed = ['Mixed'];
    dyslexiaTypes.splice(0, dyslexiaTypes.length, ...mixed);
  }

  // Default type if none identified
  if (dyslexiaTypes.length === 0 && (readingAccuracy < 80 || spellingAccuracy < 80)) {
    dyslexiaTypes.push('Phonological');
    recommendedFeatures.push('Bionic Reading', 'Text-to-speech');
  }
  if (dyslexiaTypes.length === 0) dyslexiaTypes.push('None identified');

  // Severity: weighted average → Mild, Moderate, Severe
  const weights = { reading: 0.3, spelling: 0.3, visual: 0.2, cognitive: 0.2 };
  const weighted =
    (readingAccuracy / 100) * weights.reading +
    (spellingAccuracy / 100) * weights.spelling +
    (visualAccuracy / 100) * weights.visual +
    (cognitiveAccuracy / 100) * weights.cognitive;
  const deficit = 1 - weighted; // higher deficit = more severe
  let level = 'mild';
  if (deficit >= 0.5) level = 'severe';
  else if (deficit >= 0.3) level = 'moderate';

  // Strengths
  if (readingAccuracy >= 75) strengths.push('Reading fluency');
  if (spellingAccuracy >= 75) strengths.push('Spelling accuracy');
  if (visualAccuracy >= 75) strengths.push('Visual discrimination');
  if (cognitiveAccuracy >= 75) strengths.push('Working memory');
  if (strengths.length === 0) strengths.push('Willingness to use tools', 'Clear self-awareness');

  recommendedFeatures.push('Personalized assistant settings');
  const uniqueFeatures = [...new Set(recommendedFeatures)];

  return {
    dyslexiaTypes,
    cognitiveIndicators,
    level,
    strengths,
    challenges: challenges.length ? challenges : ['Reading fluency', 'Spelling consistency'],
    recommendedFeatures: uniqueFeatures,
    completed: true,
    // Attach raw scores for Report page display
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
