/**
 * Evaluation Service
 * Provides deterministic evaluation logic for test modules
 * Uses heuristics and NLP where appropriate, delegates to LLM when reasoning is needed
 */

/**
 * Cognitive Test Evaluation
 * Measures: Attention span, Working memory, Task-switching efficiency
 */
export class CognitiveEvaluator {
  /**
   * Evaluate cognitive test performance
   * @param {Object} data - { correct, total, timeElapsed, accuracy, maxLengthReached, sequence, userSequence, responseTimes }
   * @returns {Object} - Cognitive metrics
   */
  static evaluate(data) {
    const {
      correct,
      total,
      timeElapsed,
      accuracy,
      maxLengthReached,
      sequence = [],
      userSequence = [],
      responseTimes = []
    } = data;

    // Working Memory Score (based on max sequence length achieved)
    const workingMemoryScore = Math.min(100, (maxLengthReached / 8) * 100);

    // Attention Span Score (based on accuracy and consistency)
    const attentionScore = accuracy;

    // Task-switching efficiency (based on response times if available)
    let taskSwitchingScore = 75; // Default
    if (responseTimes.length > 0) {
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const variance = responseTimes.reduce((sum, time) => sum + Math.pow(time - avgResponseTime, 2), 0) / responseTimes.length;
      // Lower variance = more consistent = better task switching
      taskSwitchingScore = Math.max(0, 100 - (variance * 10));
    }

    // Cognitive Load Score (inverse of performance under load)
    const cognitiveLoadScore = 100 - (accuracy * 0.6 + (100 - workingMemoryScore) * 0.4);

    // Focus Stability (consistency across rounds)
    const focusStabilityScore = accuracy; // Can be enhanced with round-by-round data

    // Executive Function Indicator (composite)
    const executiveFunctionScore = (
      workingMemoryScore * 0.4 +
      attentionScore * 0.3 +
      taskSwitchingScore * 0.3
    );

    // Error Pattern Analysis
    const errorPatterns = this.analyzeErrorPatterns(sequence, userSequence);

    return {
      workingMemoryScore: Math.round(workingMemoryScore),
      attentionScore: Math.round(attentionScore),
      taskSwitchingScore: Math.round(taskSwitchingScore),
      cognitiveLoadScore: Math.round(cognitiveLoadScore),
      focusStabilityScore: Math.round(focusStabilityScore),
      executiveFunctionScore: Math.round(executiveFunctionScore),
      errorPatterns,
      indicators: this.generateIndicators({
        workingMemoryScore,
        attentionScore,
        taskSwitchingScore,
        cognitiveLoadScore
      })
    };
  }

  /**
   * Analyze error patterns in sequence recall
   */
  static analyzeErrorPatterns(sequence, userSequence) {
    if (!sequence.length || !userSequence.length) return [];

    const patterns = [];
    
    // Check for transposition errors (swapped adjacent items)
    for (let i = 0; i < Math.min(sequence.length, userSequence.length) - 1; i++) {
      if (sequence[i] === userSequence[i + 1] && sequence[i + 1] === userSequence[i]) {
        patterns.push('Transposition');
        break;
      }
    }

    // Check for serial position effects (better at start/end)
    const startAccuracy = sequence.slice(0, 2).every((n, i) => userSequence[i] === n);
    const endAccuracy = sequence.slice(-2).every((n, i) => userSequence[userSequence.length - 2 + i] === n);
    if (startAccuracy && !endAccuracy) patterns.push('Primacy Effect');
    if (!startAccuracy && endAccuracy) patterns.push('Recency Effect');

    // Check for omissions
    if (userSequence.length < sequence.length) {
      patterns.push('Omissions');
    }

    // Check for intrusions
    if (userSequence.length > sequence.length) {
      patterns.push('Intrusions');
    }

    return patterns;
  }

  /**
   * Generate cognitive indicators
   */
  static generateIndicators(scores) {
    const indicators = [];
    
    if (scores.workingMemoryScore < 60) {
      indicators.push('Working memory difficulty');
    }
    if (scores.attentionScore < 60) {
      indicators.push('Attention span challenges');
    }
    if (scores.taskSwitchingScore < 60) {
      indicators.push('Task-switching inefficiency');
    }
    if (scores.cognitiveLoadScore > 70) {
      indicators.push('High cognitive load sensitivity');
    }

    return indicators;
  }
}

/**
 * Visual Processing Test Evaluation
 * Measures: Visual crowding, Line tracking, Symbol discrimination
 */
export class VisualEvaluator {
  /**
   * Evaluate visual test performance
   * @param {Object} data - { hits, falsePositives, correctCount, selectedCount, timeElapsed, accuracy, target, clickPattern }
   * @returns {Object} - Visual metrics
   */
  static evaluate(data) {
    const {
      hits,
      falsePositives,
      correctCount,
      selectedCount,
      timeElapsed,
      accuracy,
      target,
      clickPattern = []
    } = data;

    // Visual Stress Score (based on false positives and time)
    const falsePositiveRate = correctCount > 0 ? (falsePositives / correctCount) * 100 : 0;
    const visualStressScore = Math.max(0, 100 - (falsePositiveRate * 2 + (timeElapsed > 90 ? 20 : 0)));

    // Tracking Difficulty Index (based on accuracy and efficiency)
    const efficiency = correctCount > 0 ? (hits / (timeElapsed || 1)) * 60 : 0;
    const trackingDifficultyIndex = Math.max(0, 100 - (accuracy * 0.7 + (efficiency < 1 ? 30 : 0)));

    // Pattern Recognition Efficiency
    const patternRecognitionScore = accuracy;

    // Visual Crowding Assessment (based on false positives and selection pattern)
    const crowdingScore = this.assessCrowding(hits, falsePositives, clickPattern);

    // Symbol Discrimination Score
    const discriminationScore = accuracy;

    return {
      visualStressScore: Math.round(visualStressScore),
      trackingDifficultyIndex: Math.round(trackingDifficultyIndex),
      patternRecognitionScore: Math.round(patternRecognitionScore),
      crowdingScore: Math.round(crowdingScore),
      discriminationScore: Math.round(discriminationScore),
      indicators: this.generateIndicators({
        visualStressScore,
        trackingDifficultyIndex,
        crowdingScore
      })
    };
  }

  /**
   * Assess visual crowding
   */
  static assessCrowding(hits, falsePositives, clickPattern) {
    // High false positives relative to hits suggests crowding issues
    if (hits === 0) return 0;
    
    const errorRate = falsePositives / (hits + falsePositives);
    // If error rate is high, crowding is likely
    return Math.max(0, 100 - (errorRate * 150));
  }

  /**
   * Generate visual indicators
   */
  static generateIndicators(scores) {
    const indicators = [];
    
    if (scores.visualStressScore < 60) {
      indicators.push('Visual stress');
    }
    if (scores.trackingDifficultyIndex > 50) {
      indicators.push('Line tracking difficulty');
    }
    if (scores.crowdingScore < 60) {
      indicators.push('Visual crowding');
    }
    if (scores.discriminationScore < 60) {
      indicators.push('Symbol discrimination challenges');
    }

    return indicators;
  }
}

/**
 * Reading Test Evaluation (uses LLM for analysis, but provides structure)
 */
export class ReadingEvaluator {
  /**
   * Structure reading data for holistic analysis
   * @param {Object} data - Reading test results
   * @returns {Object} - Structured reading metrics
   */
  static structure(data) {
    return {
      accuracy: data.accuracyPercent || 0,
      wpm: data.wpm || 0,
      errorType: data.errorType || 'Unknown',
      errorPatterns: data.errorPatterns || [],
      dyslexiaLikelihood: data.dyslexiaLikelihood || 'Low',
      phonologicalIssues: data.phonologicalIssues || [],
      visualIssues: data.visualIssues || [],
      strengths: data.strengths || [],
      fluencyScore: this.calculateFluencyScore(data),
      decodingScore: this.calculateDecodingScore(data)
    };
  }

  /**
   * Calculate reading fluency score
   */
  static calculateFluencyScore(data) {
    const wpm = data.wpm || 0;
    const accuracy = data.accuracyPercent || 0;
    
    // Normalize WPM (typical range: 50-200 for children)
    const normalizedWpm = Math.min(100, (wpm / 200) * 100);
    
    // Fluency = speed + accuracy
    return Math.round((normalizedWpm * 0.4 + accuracy * 0.6));
  }

  /**
   * Calculate phonological decoding score
   */
  static calculateDecodingScore(data) {
    const accuracy = data.accuracyPercent || 0;
    const phonologicalIssues = data.phonologicalIssues || [];
    
    // Lower score if many phonological issues
    const issuePenalty = Math.min(30, phonologicalIssues.length * 5);
    
    return Math.max(0, Math.round(accuracy - issuePenalty));
  }
}

/**
 * Spelling Test Evaluation (uses LLM for classification, provides structure)
 */
export class SpellingEvaluator {
  /**
   * Structure spelling data for holistic analysis
   * @param {Object} data - Spelling test results
   * @returns {Object} - Structured spelling metrics
   */
  static structure(data) {
    return {
      accuracy: data.accuracyPercent || 0,
      errorTypes: data.errorTypes || [],
      orthographicWeakness: data.orthographicWeakness || 0,
      phonemeGraphemeMismatch: data.phonemeGraphemeMismatch || 0,
      errorClassifications: data.errorClassifications || [],
      feedback: data.feedback || ''
    };
  }
}
