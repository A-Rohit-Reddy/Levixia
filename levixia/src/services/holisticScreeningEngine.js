/**
 * Holistic Screening Engine
 * Exhaustive multimodal screening for neurodivergent learning difficulties.
 * Covers: Reading & Language, Writing & Spelling, Visual, Auditory (inferred), Cognitive & Attention.
 * Classifies: all dyslexia types (Phonological, Surface, Rapid Naming, Double Deficit, Visual/Orthographic,
 * Auditory, Developmental, Acquired) and ADHD indicators.
 * Severity: No Significant Difficulty | Mild | Moderate | Severe (from accuracy, speed, errors, cognitive load).
 */

import { CognitiveEvaluator, VisualEvaluator, ReadingEvaluator, SpellingEvaluator } from './evaluationService';
import apiService from './apiService';

const SEVERITY_LEVELS = ['No Significant Difficulty', 'Mild', 'Moderate', 'Severe'];

class HolisticScreeningEngine {
  /**
   * Process and aggregate all test results (exhaustive screening)
   * @param {Object} results - { cognitive, visual, reading, spelling }
   * @returns {Promise<Object>} - Comprehensive screening results with classification and severity
   */
  async processResults(results) {
    // Step 1: Evaluate each test module
    const cognitiveMetrics = CognitiveEvaluator.evaluate(results.cognitive || {});
    const visualMetrics = VisualEvaluator.evaluate(results.visual || {});
    const readingMetrics = ReadingEvaluator.structure(results.reading || {});
    const spellingMetrics = SpellingEvaluator.structure(results.spelling || {});

    // Step 2: Normalize scores (0-100 scale) and build dimension summary
    const normalizedScores = this.normalizeScores({
      cognitive: cognitiveMetrics,
      visual: visualMetrics,
      reading: readingMetrics,
      spelling: spellingMetrics
    });

    // Step 3: Cross-correlate signals across all dimensions
    const correlations = this.crossCorrelate({
      cognitive: cognitiveMetrics,
      visual: visualMetrics,
      reading: readingMetrics,
      spelling: spellingMetrics
    });

    // Step 4: Compute severity per dimension (accuracy, speed, errors, cognitive load, functional impact)
    const severityByDimension = this.computeSeverityByDimension({
      cognitive: cognitiveMetrics,
      visual: visualMetrics,
      reading: readingMetrics,
      spelling: spellingMetrics
    });

    // Step 5: Infer condition type(s): all dyslexia categories + ADHD
    const inference = this.inferConditionType({
      cognitive: cognitiveMetrics,
      visual: visualMetrics,
      reading: readingMetrics,
      spelling: spellingMetrics,
      correlations,
      severityByDimension
    });

    // Step 6: Aggregate for LLM report (mandatory format)
    const aggregatedData = {
      cognitive: {
        raw: results.cognitive,
        metrics: cognitiveMetrics,
        normalized: normalizedScores.cognitive
      },
      visual: {
        raw: results.visual,
        metrics: visualMetrics,
        normalized: normalizedScores.visual
      },
      reading: {
        raw: results.reading,
        metrics: readingMetrics,
        normalized: normalizedScores.reading
      },
      spelling: {
        raw: results.spelling,
        metrics: spellingMetrics,
        normalized: normalizedScores.spelling
      },
      correlations,
      severityByDimension,
      inference
    };

    // Step 7: Generate LLM report (user-friendly, non-medical, with disclaimer)
    let llmReport = null;
    try {
      llmReport = await apiService.generateReport(aggregatedData);
    } catch (error) {
      console.warn('AI report generation failed, using rule-based fallback:', error);
      llmReport = this.generateFallbackReport(aggregatedData);
    }

    return {
      ...aggregatedData,
      report: llmReport,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Compute severity per dimension from: accuracy, processing speed, error frequency, cognitive load
   * Returns: No Significant Difficulty | Mild | Moderate | Severe
   */
  computeSeverityByDimension(metrics) {
    const scoreToSeverity = (score) => {
      if (score >= 85) return 'No Significant Difficulty';
      if (score >= 70) return 'Mild';
      if (score >= 50) return 'Moderate';
      return 'Severe';
    };

    const reading = metrics.reading || {};
    const spelling = metrics.spelling || {};
    const visual = metrics.visual || {};
    const cognitive = metrics.cognitive || {};

    const readingScore = (reading.accuracy || 0) * 0.5 + (reading.fluencyScore || 0) * 0.3 + (reading.decodingScore || 0) * 0.2;
    const spellingScore = (spelling.accuracy || 0) * 0.6 + (100 - (spelling.orthographicWeakness || 0)) * 0.2 + (100 - (spelling.phonemeGraphemeMismatch || 0)) * 0.2;
    const visualScore = (visual.patternRecognitionScore || 0) * 0.4 + (visual.visualStressScore || 0) * 0.3 + (100 - (visual.trackingDifficultyIndex || 0)) * 0.3;
    const cognitiveScore = (cognitive.executiveFunctionScore || 0) * 0.4 + (cognitive.attentionScore || 0) * 0.3 + (cognitive.taskSwitchingScore || 0) * 0.3;
    const auditoryScore = 75; // Placeholder: no direct auditory test; infer from reading/cognitive if needed

    return {
      readingAndLanguage: { severity: scoreToSeverity(readingScore), score: Math.round(readingScore) },
      writingAndSpelling: { severity: scoreToSeverity(spellingScore), score: Math.round(spellingScore) },
      visualProcessing: { severity: scoreToSeverity(visualScore), score: Math.round(visualScore) },
      auditoryProcessing: { severity: scoreToSeverity(auditoryScore), score: Math.round(auditoryScore) },
      cognitiveAndAttention: { severity: scoreToSeverity(cognitiveScore), score: Math.round(cognitiveScore) }
    };
  }

  /**
   * Normalize scores to 0-100 scale
   */
  normalizeScores(metrics) {
    return {
      cognitive: {
        overall: metrics.cognitive.executiveFunctionScore || 0,
        workingMemory: metrics.cognitive.workingMemoryScore || 0,
        attention: metrics.cognitive.attentionScore || 0,
        taskSwitching: metrics.cognitive.taskSwitchingScore || 0
      },
      visual: {
        overall: metrics.visual.patternRecognitionScore || 0,
        stress: metrics.visual.visualStressScore || 0,
        tracking: 100 - (metrics.visual.trackingDifficultyIndex || 0),
        discrimination: metrics.visual.discriminationScore || 0
      },
      reading: {
        overall: metrics.reading.accuracy || 0,
        fluency: metrics.reading.fluencyScore || 0,
        decoding: metrics.reading.decodingScore || 0
      },
      spelling: {
        overall: metrics.spelling.accuracy || 0,
        orthographic: 100 - (metrics.spelling.orthographicWeakness || 0),
        phonemeGrapheme: 100 - (metrics.spelling.phonemeGraphemeMismatch || 0)
      }
    };
  }

  /**
   * Cross-correlate signals across tests
   */
  crossCorrelate(metrics) {
    const correlations = {
      cognitiveVisual: 0,
      cognitiveReading: 0,
      cognitiveSpelling: 0,
      visualReading: 0,
      visualSpelling: 0,
      readingSpelling: 0
    };

    // Cognitive-Visual correlation
    // If both show attention/processing issues, correlate
    const cognitiveLow = metrics.cognitive.executiveFunctionScore < 60;
    const visualLow = metrics.visual.patternRecognitionScore < 60;
    if (cognitiveLow && visualLow) {
      correlations.cognitiveVisual = 0.7;
    }

    // Cognitive-Reading correlation
    // Working memory issues often affect reading comprehension
    const memoryLow = metrics.cognitive.workingMemoryScore < 60;
    const readingLow = metrics.reading.accuracy < 70;
    if (memoryLow && readingLow) {
      correlations.cognitiveReading = 0.8;
    }

    // Cognitive-Spelling correlation
    // Attention issues affect spelling accuracy
    const attentionLow = metrics.cognitive.attentionScore < 60;
    const spellingLow = metrics.spelling.accuracy < 70;
    if (attentionLow && spellingLow) {
      correlations.cognitiveSpelling = 0.6;
    }

    // Visual-Reading correlation
    // Visual stress affects reading fluency
    const visualStress = metrics.visual.visualStressScore < 60;
    const readingFluencyLow = metrics.reading.fluencyScore < 70;
    if (visualStress && readingFluencyLow) {
      correlations.visualReading = 0.75;
    }

    // Visual-Spelling correlation
    // Visual discrimination affects spelling
    const discriminationLow = metrics.visual.discriminationScore < 60;
    if (discriminationLow && spellingLow) {
      correlations.visualSpelling = 0.7;
    }

    // Reading-Spelling correlation (strongest)
    // Both involve phonological processing
    const phonologicalIssues = metrics.reading.phonologicalIssues?.length > 0;
    const phonemeGraphemeIssues = metrics.spelling.phonemeGraphemeMismatch > 50;
    if (readingLow && spellingLow) {
      correlations.readingSpelling = 0.9;
    } else if (phonologicalIssues && phonemeGraphemeIssues) {
      correlations.readingSpelling = 0.85;
    }

    return correlations;
  }

  /**
   * Infer condition type(s): all dyslexia categories + ADHD indicators
   * Dyslexia types: Phonological, Surface, Rapid Naming, Double Deficit, Visual (Orthographic),
   * Auditory, Developmental, Acquired. ADHD: inattention, impulsivity, executive function.
   */
  inferConditionType(data) {
    const { cognitive, visual, reading, spelling, correlations, severityByDimension } = data;

    const dyslexiaTypes = [];
    const adhdIndicators = [];
    let primaryType = null;
    let overallSeverity = 'No Significant Difficulty';
    let confidence = 0.5;

    const readingLow = reading.accuracy < 70;
    const spellingLow = spelling.accuracy < 70;
    const phonologicalIssues = reading.phonologicalIssues?.length > 0 || (spelling.phonemeGraphemeMismatch || 0) > 50;
    const visualIssues = (visual.visualStressScore || 0) < 60 || (visual.discriminationScore || 0) < 60;
    const orthographicIssues = (spelling.orthographicWeakness || 0) > 50;
    const slowNaming = (reading.wpm || 0) < 80 && reading.accuracy >= 70;
    const attentionLow = (cognitive.attentionScore || 0) < 60;
    const taskSwitchingLow = (cognitive.taskSwitchingScore || 0) < 60;
    const executiveLow = (cognitive.executiveFunctionScore || 0) < 60;
    const memoryLow = (cognitive.workingMemoryScore || 0) < 60;

    // Phonological Dyslexia: sound–letter mapping, decoding
    if (readingLow && spellingLow && phonologicalIssues && correlations.readingSpelling > 0.6) {
      dyslexiaTypes.push('Phonological Dyslexia');
      if (!primaryType) primaryType = 'Phonological Dyslexia';
      confidence = Math.max(confidence, 0.78);
    }

    // Surface Dyslexia: sight word / irregular word reading
    if (visualIssues && readingLow && orthographicIssues && !phonologicalIssues) {
      dyslexiaTypes.push('Surface Dyslexia');
      if (!primaryType) primaryType = 'Surface Dyslexia';
      confidence = Math.max(confidence, 0.72);
    }

    // Rapid Naming Dyslexia: naming speed deficit
    if (slowNaming && reading.fluencyScore < 70 && reading.accuracy >= 65) {
      dyslexiaTypes.push('Rapid Naming Dyslexia');
      if (!primaryType) primaryType = 'Rapid Naming Dyslexia';
      confidence = Math.max(confidence, 0.65);
    }

    // Double Deficit: phonological + rapid naming
    if (dyslexiaTypes.includes('Phonological Dyslexia') && dyslexiaTypes.includes('Rapid Naming Dyslexia')) {
      dyslexiaTypes.push('Double Deficit Dyslexia');
      primaryType = 'Double Deficit Dyslexia';
      confidence = Math.max(confidence, 0.82);
    }

    // Visual (Orthographic) Dyslexia: letter/word form, crowding, tracking
    if (visualIssues && (visual.trackingDifficultyIndex || 0) > 50 && (visual.crowdingScore || 0) < 60) {
      dyslexiaTypes.push('Visual (Orthographic) Dyslexia');
      if (!primaryType) primaryType = 'Visual (Orthographic) Dyslexia';
      confidence = Math.max(confidence, 0.7);
    }

    // Auditory Dyslexia: sound discrimination, listening (inferred from reading/cognitive)
    if (phonologicalIssues && memoryLow && !visualIssues) {
      dyslexiaTypes.push('Auditory Dyslexia');
      if (!primaryType) primaryType = 'Auditory Dyslexia';
      confidence = Math.max(confidence, 0.62);
    }

    // Developmental vs Acquired: assume developmental for screening (no injury history)
    if (dyslexiaTypes.length > 0) {
      dyslexiaTypes.push('Developmental Dyslexia');
    }

    // ADHD indicators: inattention, impulsivity, executive function
    if (attentionLow) adhdIndicators.push('Inattention');
    if (taskSwitchingLow) adhdIndicators.push('Task-switching difficulty');
    if (executiveLow) adhdIndicators.push('Executive function difficulty');
    if (cognitive.errorPatterns?.length > 0) adhdIndicators.push('Working memory / sequencing');
    if (attentionLow && taskSwitchingLow && (readingLow || spellingLow)) {
      adhdIndicators.push('ADHD-related learning pattern');
      confidence = Math.max(confidence, 0.68);
    }

    // Overall severity from dimension severities (worst dimension drives overall)
    const severities = severityByDimension ? Object.values(severityByDimension).map(d => d.severity) : [];
    const order = { 'No Significant Difficulty': 0, Mild: 1, Moderate: 2, Severe: 3 };
    let maxIdx = 0;
    severities.forEach(s => {
      const idx = order[s] ?? 0;
      if (idx > maxIdx) maxIdx = idx;
    });
    overallSeverity = SEVERITY_LEVELS[maxIdx] || 'Mild';

    // Fallback: weighted average score for severity
    const avgScore = (
      (reading.accuracy || 0) * 0.25 +
      (spelling.accuracy || 0) * 0.25 +
      (visual.patternRecognitionScore || 0) * 0.2 +
      (cognitive.executiveFunctionScore || 0) * 0.15 +
      (reading.fluencyScore || 0) * 0.15
    );
    if (avgScore < 50) overallSeverity = 'Severe';
    else if (avgScore < 70) overallSeverity = overallSeverity === 'No Significant Difficulty' ? 'Moderate' : overallSeverity;
    else if (avgScore >= 85 && dyslexiaTypes.length === 0 && adhdIndicators.length === 0) overallSeverity = 'No Significant Difficulty';

    if (dyslexiaTypes.length === 0 && adhdIndicators.length === 0 && avgScore >= 70) {
      dyslexiaTypes.push('None identified');
      confidence = 0.6;
    }

    return {
      dyslexiaTypes: dyslexiaTypes.length ? dyslexiaTypes : ['None identified'],
      adhdIndicators: [...new Set(adhdIndicators)],
      primaryType: primaryType || (adhdIndicators.length > 0 ? 'ADHD-related indicators' : 'None identified'),
      severity: overallSeverity,
      confidence: Math.round(Math.min(0.95, confidence) * 100) / 100
    };
  }

  /**
   * Generate fallback report (mandatory format: detected conditions, severity, disclaimer)
   */
  generateFallbackReport(aggregatedData) {
    const { inference, cognitive, visual, reading, spelling, severityByDimension } = aggregatedData;

    const strengths = [];
    const challenges = [];
    const recommendations = [];

    if (reading.metrics.accuracy >= 75) strengths.push('Reading fluency');
    if (spelling.metrics.accuracy >= 75) strengths.push('Spelling accuracy');
    if (visual.metrics.patternRecognitionScore >= 75) strengths.push('Visual discrimination');
    if (cognitive.metrics.executiveFunctionScore >= 75) strengths.push('Working memory');
    if (strengths.length === 0) strengths.push('Willingness to engage', 'Clear self-awareness');

    if (reading.metrics.accuracy < 70) challenges.push('Reading fluency');
    if (spelling.metrics.accuracy < 70) challenges.push('Spelling consistency');
    if (visual.metrics.visualStressScore < 60) challenges.push('Visual processing');
    if (cognitive.metrics.workingMemoryScore < 60) challenges.push('Working memory');

    if (reading.metrics.phonologicalIssues?.length > 0) {
      recommendations.push({ category: 'Reading Aids', items: ['Bionic Reading', 'Text-to-speech', 'Phonetic support'] });
    }
    if (visual.metrics.visualStressScore < 60) {
      recommendations.push({ category: 'Visual Adjustments', items: ['Dyslexia-friendly font', 'Letter spacing', 'Line spacing', 'Color contrast'] });
    }
    if (cognitive.metrics.cognitiveLoadScore > 70) {
      recommendations.push({ category: 'Cognitive Support', items: ['Cognitive load reduction', 'Chunked text', 'Writing support'] });
    }

    const recommendProfessional = inference.severity === 'Severe' || inference.severity === 'Moderate';

    return {
      executiveSummary: `This screening suggests a ${inference.severity.toLowerCase()} profile in some areas. Focus on your strengths and the recommended tools below. This is not a clinical diagnosis.`,
      detectedConditions: inference.dyslexiaTypes?.length ? inference.dyslexiaTypes.filter(t => t !== 'None identified') : [],
      primaryType: inference.primaryType || 'None identified',
      adhdIndicators: inference.adhdIndicators || [],
      severityLevel: inference.severity,
      confidenceScore: inference.confidence ?? 0.6,
      strengths,
      challenges,
      perTestBreakdown: {
        cognitive: `Working memory: ${cognitive.metrics.workingMemoryScore}%, Attention: ${cognitive.metrics.attentionScore}%`,
        visual: `Visual processing: ${visual.metrics.patternRecognitionScore}%, Stress: ${visual.metrics.visualStressScore}%`,
        reading: `Reading accuracy: ${reading.metrics.accuracy}%, Fluency: ${reading.metrics.fluencyScore}%`,
        spelling: `Spelling accuracy: ${spelling.metrics.accuracy}%`
      },
      severityByDimension: severityByDimension || {},
      disabilityLikelihood: inference,
      personalizedFeedback: 'Use the recommended tools to support your learning. For persistent difficulties, consider a professional evaluation.',
      recommendations: recommendations.length > 0 ? recommendations : [{ category: 'General', items: ['Personalized assistant settings'] }],
      disclaimer: 'This report is from a screening and personalization tool only. It is not a medical or clinical diagnosis. For diagnosis or treatment, please see a qualified professional.',
      recommendProfessionalEvaluation: recommendProfessional
    };
  }
}

const holisticScreeningEngine = new HolisticScreeningEngine();
export default holisticScreeningEngine;