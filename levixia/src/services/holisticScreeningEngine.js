/**
 * Holistic Screening Engine
 * Aggregates results from all test modules
 * Cross-correlates signals to infer learning disability types and severity
 */

import { CognitiveEvaluator, VisualEvaluator, ReadingEvaluator, SpellingEvaluator } from './evaluationService';
import apiService from './apiService';

class HolisticScreeningEngine {
  /**
   * Process and aggregate all test results
   * @param {Object} results - { cognitive, visual, reading, spelling }
   * @returns {Promise<Object>} - Comprehensive screening results
   */
  async processResults(results) {
    // Step 1: Evaluate each test module
    const cognitiveMetrics = CognitiveEvaluator.evaluate(results.cognitive || {});
    const visualMetrics = VisualEvaluator.evaluate(results.visual || {});
    const readingMetrics = ReadingEvaluator.structure(results.reading || {});
    const spellingMetrics = SpellingEvaluator.structure(results.spelling || {});

    // Step 2: Normalize scores (0-100 scale)
    const normalizedScores = this.normalizeScores({
      cognitive: cognitiveMetrics,
      visual: visualMetrics,
      reading: readingMetrics,
      spelling: spellingMetrics
    });

    // Step 3: Cross-correlate signals
    const correlations = this.crossCorrelate({
      cognitive: cognitiveMetrics,
      visual: visualMetrics,
      reading: readingMetrics,
      spelling: spellingMetrics
    });

    // Step 4: Infer learning disability type and severity
    const inference = this.inferDisabilityType({
      cognitive: cognitiveMetrics,
      visual: visualMetrics,
      reading: readingMetrics,
      spelling: spellingMetrics,
      correlations
    });

    // Step 5: Aggregate all data for LLM report generation
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
      inference
    };

    // Step 6: Generate LLM report via backend API
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
   * Infer learning disability type and severity
   */
  inferDisabilityType(data) {
    const { cognitive, visual, reading, spelling, correlations } = data;

    const disabilityTypes = [];
    let severity = 'Mild';
    let confidence = 0.5;

    // Dyslexia Indicators
    const readingLow = reading.accuracy < 70;
    const spellingLow = spelling.accuracy < 70;
    const phonologicalIssues = reading.phonologicalIssues?.length > 0 || spelling.phonemeGraphemeMismatch > 50;
    const visualIssues = visual.visualStressScore < 60 || visual.discriminationScore < 60;

    // Phonological Dyslexia
    if (readingLow && spellingLow && phonologicalIssues && correlations.readingSpelling > 0.7) {
      disabilityTypes.push('Dyslexia (Phonological)');
      confidence = 0.8;
    }

    // Surface Dyslexia
    if (visualIssues && readingLow && !phonologicalIssues) {
      disabilityTypes.push('Dyslexia (Surface)');
      confidence = 0.75;
    }

    // Visual Processing Disorder
    if (visualIssues && visual.trackingDifficultyIndex > 50 && !readingLow) {
      disabilityTypes.push('Visual Processing Disorder');
      confidence = 0.7;
    }

    // Dysgraphia (spelling-focused)
    if (spellingLow && spelling.orthographicWeakness > 50 && !readingLow) {
      disabilityTypes.push('Dysgraphia');
      confidence = 0.7;
    }

    // ADHD-related learning difficulty
    const attentionLow = cognitive.attentionScore < 60;
    const taskSwitchingLow = cognitive.taskSwitchingScore < 60;
    if (attentionLow && taskSwitchingLow && (readingLow || spellingLow)) {
      disabilityTypes.push('ADHD-related Learning Difficulty');
      confidence = 0.65;
    }

    // Mixed (multiple types)
    if (disabilityTypes.length >= 2) {
      disabilityTypes.splice(0, disabilityTypes.length, 'Mixed Learning Profile');
      confidence = 0.85;
    }

    // Determine severity
    const avgScore = (
      (reading.accuracy || 0) * 0.3 +
      (spelling.accuracy || 0) * 0.3 +
      (visual.patternRecognitionScore || 0) * 0.2 +
      (cognitive.executiveFunctionScore || 0) * 0.2
    ) / 100;

    if (avgScore < 0.5) {
      severity = 'High';
    } else if (avgScore < 0.7) {
      severity = 'Moderate';
    } else {
      severity = 'Mild';
    }

    // If no specific type identified but scores are low
    if (disabilityTypes.length === 0 && avgScore < 0.7) {
      disabilityTypes.push('Learning Differences');
      confidence = 0.6;
    }

    return {
      types: disabilityTypes.length > 0 ? disabilityTypes : ['None identified'],
      severity,
      confidence: Math.round(confidence * 100) / 100
    };
  }

  /**
   * Generate fallback report if LLM fails
   */
  generateFallbackReport(aggregatedData) {
    const { inference, cognitive, visual, reading, spelling } = aggregatedData;

    const strengths = [];
    const challenges = [];
    const recommendations = [];

    // Identify strengths
    if (reading.metrics.accuracy >= 75) strengths.push('Reading fluency');
    if (spelling.metrics.accuracy >= 75) strengths.push('Spelling accuracy');
    if (visual.metrics.patternRecognitionScore >= 75) strengths.push('Visual discrimination');
    if (cognitive.metrics.executiveFunctionScore >= 75) strengths.push('Working memory');
    if (strengths.length === 0) strengths.push('Willingness to engage', 'Clear self-awareness');

    // Identify challenges
    if (reading.metrics.accuracy < 70) challenges.push('Reading fluency');
    if (spelling.metrics.accuracy < 70) challenges.push('Spelling consistency');
    if (visual.metrics.visualStressScore < 60) challenges.push('Visual processing');
    if (cognitive.metrics.workingMemoryScore < 60) challenges.push('Working memory');

    // Generate recommendations
    if (reading.metrics.phonologicalIssues?.length > 0) {
      recommendations.push({ category: 'Reading Aids', items: ['Bionic Reading', 'Text-to-speech', 'Phonetic support'] });
    }
    if (visual.metrics.visualStressScore < 60) {
      recommendations.push({ category: 'Visual Adjustments', items: ['Dyslexia-friendly font', 'Letter spacing', 'Line spacing', 'Color contrast'] });
    }
    if (cognitive.metrics.cognitiveLoadScore > 70) {
      recommendations.push({ category: 'Cognitive Support', items: ['Cognitive load reduction', 'Chunked text', 'Writing support'] });
    }

    return {
      executiveSummary: `Your assessment shows ${inference.severity.toLowerCase()} learning profile. Focus on your strengths and use recommended tools for support.`,
      perTestBreakdown: {
        cognitive: `Working memory: ${cognitive.metrics.workingMemoryScore}%, Attention: ${cognitive.metrics.attentionScore}%`,
        visual: `Visual processing: ${visual.metrics.patternRecognitionScore}%, Stress: ${visual.metrics.visualStressScore}%`,
        reading: `Reading accuracy: ${reading.metrics.accuracy}%, Fluency: ${reading.metrics.fluencyScore}%`,
        spelling: `Spelling accuracy: ${spelling.metrics.accuracy}%`
      },
      strengths,
      challenges,
      disabilityLikelihood: inference,
      personalizedFeedback: 'Keep practicing and use the recommended tools to support your learning journey!',
      recommendations: recommendations.length > 0 ? recommendations : [
        { category: 'General', items: ['Personalized assistant settings'] }
      ]
    };
  }
}

export default new HolisticScreeningEngine();
