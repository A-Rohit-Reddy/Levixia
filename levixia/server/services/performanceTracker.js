/**
 * Performance Tracker
 * Monitors user progress and performance metrics
 */

class PerformanceTracker {
  /**
   * Track reading session
   * @param {Object} sessionData - Session data
   * @returns {Object} - Tracked metrics
   */
  trackReadingSession(sessionData) {
    const {
      textLength,
      timeSpent,
      accuracy,
      wpm,
      errors = [],
      featuresUsed = []
    } = sessionData;

    const metrics = {
      timestamp: new Date().toISOString(),
      textLength,
      timeSpent,
      accuracy: accuracy || null,
      wpm: wpm || (textLength > 0 && timeSpent > 0 ? Math.round((textLength / timeSpent) * 60) : null),
      errorCount: errors.length,
      errorTypes: this.categorizeErrors(errors),
      featuresUsed,
      efficiency: this.calculateEfficiency(textLength, timeSpent, accuracy)
    };

    return metrics;
  }

  /**
   * Track writing session
   * @param {Object} sessionData - Session data
   * @returns {Object} - Tracked metrics
   */
  trackWritingSession(sessionData) {
    const {
      userText,
      referenceText,
      timeSpent,
      corrections = [],
      suggestionsAccepted = 0,
      suggestionsRejected = 0
    } = sessionData;

    const accuracy = referenceText ? this.calculateAccuracy(userText, referenceText) : null;

    const metrics = {
      timestamp: new Date().toISOString(),
      textLength: userText.length,
      wordCount: userText.split(/\s+/).length,
      timeSpent,
      accuracy,
      correctionCount: corrections.length,
      suggestionsAccepted,
      suggestionsRejected,
      improvementRate: this.calculateImprovementRate(corrections, suggestionsAccepted)
    };

    return metrics;
  }

  /**
   * Analyze performance trends
   * @param {Array} sessions - Historical sessions
   * @returns {Object} - Trend analysis
   */
  analyzeTrends(sessions) {
    if (!sessions || sessions.length === 0) {
      return {
        trend: 'insufficient_data',
        improvement: 0,
        recommendations: []
      };
    }

    // Calculate trends
    const recentSessions = sessions.slice(-10); // Last 10 sessions
    const olderSessions = sessions.slice(-20, -10); // Previous 10

    const recentAvgAccuracy = this.average(recentSessions.map(s => s.accuracy || 0));
    const olderAvgAccuracy = this.average(olderSessions.map(s => s.accuracy || 0));

    const improvement = recentAvgAccuracy - olderAvgAccuracy;
    const trend = improvement > 5 ? 'improving' : improvement < -5 ? 'declining' : 'stable';

    const recommendations = this.generateRecommendations(sessions, trend, improvement);

    return {
      trend,
      improvement: Math.round(improvement * 10) / 10,
      recentAverage: Math.round(recentAvgAccuracy * 10) / 10,
      recommendations,
      sessionCount: sessions.length
    };
  }

  /**
   * Calculate efficiency score
   */
  calculateEfficiency(textLength, timeSpent, accuracy) {
    if (!timeSpent || timeSpent === 0) return 0;
    
    const speed = textLength / timeSpent;
    const accuracyWeight = (accuracy || 50) / 100;
    
    return Math.round(speed * accuracyWeight * 100) / 100;
  }

  /**
   * Calculate accuracy between texts
   */
  calculateAccuracy(userText, referenceText) {
    const userWords = userText.toLowerCase().split(/\s+/);
    const refWords = referenceText.toLowerCase().split(/\s+/);
    let matches = 0;
    const minLen = Math.min(userWords.length, refWords.length);
    
    for (let i = 0; i < minLen; i++) {
      if (userWords[i] === refWords[i]) matches++;
    }
    
    return refWords.length > 0 ? Math.round((matches / refWords.length) * 100) : 0;
  }

  /**
   * Categorize errors
   */
  categorizeErrors(errors) {
    const categories = {
      spelling: 0,
      grammar: 0,
      punctuation: 0,
      other: 0
    };

    errors.forEach(error => {
      const type = error.type || 'other';
      if (categories.hasOwnProperty(type)) {
        categories[type]++;
      } else {
        categories.other++;
      }
    });

    return categories;
  }

  /**
   * Calculate improvement rate
   */
  calculateImprovementRate(corrections, accepted) {
    if (corrections.length === 0) return 0;
    return Math.round((accepted / corrections.length) * 100);
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(sessions, trend, improvement) {
    const recommendations = [];

    if (trend === 'declining') {
      recommendations.push('Consider taking more breaks during reading sessions');
      recommendations.push('Review your learning profile settings');
    } else if (trend === 'improving') {
      recommendations.push('Great progress! Continue with current approach');
    }

    const avgAccuracy = this.average(sessions.map(s => s.accuracy || 0));
    if (avgAccuracy < 70) {
      recommendations.push('Focus on accuracy over speed');
    }

    return recommendations;
  }

  /**
   * Calculate average
   */
  average(numbers) {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }
}

module.exports = new PerformanceTracker();
