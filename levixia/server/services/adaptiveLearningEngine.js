/**
 * Adaptive Learning Engine
 * Updates user profile and fine-tunes assistant behavior over time
 */

const userProfileEngine = require('./userProfileEngine');
const performanceTracker = require('./performanceTracker');

class AdaptiveLearningEngine {
  /**
   * Update user profile based on performance
   * @param {Object} currentProfile - Current user profile
   * @param {Array} performanceHistory - Historical performance data
   * @returns {Promise<Object>} - Updated profile
   */
  async updateProfile(currentProfile, performanceHistory) {
    console.log('🔄 Adaptive Learning Engine: Updating profile');
    
    const trends = performanceTracker.analyzeTrends(performanceHistory);
    
    // Analyze what's working and what's not
    const analysis = this.analyzePerformance(currentProfile, trends, performanceHistory);
    
    // Generate updated profile
    const updatedProfile = { ...currentProfile };
    
    // Adjust features based on performance
    if (trends.trend === 'improving' && trends.improvement > 10) {
      // User is improving - consider reducing assistance
      updatedProfile = this.reduceAssistance(updatedProfile, analysis);
    } else if (trends.trend === 'declining') {
      // User struggling - increase assistance
      updatedProfile = this.increaseAssistance(updatedProfile, analysis);
    }

    // Update preferences based on usage patterns
    updatedProfile = this.updatePreferences(updatedProfile, performanceHistory);

    updatedProfile.updatedAt = new Date().toISOString();
    updatedProfile.lastUpdateReason = analysis.updateReason;

    return updatedProfile;
  }

  /**
   * Analyze performance patterns
   */
  analyzePerformance(profile, trends, history) {
    const recentSessions = history.slice(-5);
    
    // Analyze feature usage
    const featureUsage = {};
    recentSessions.forEach(session => {
      (session.featuresUsed || []).forEach(feature => {
        featureUsage[feature] = (featureUsage[feature] || 0) + 1;
      });
    });

    // Identify most/least used features
    const mostUsed = Object.keys(featureUsage).sort((a, b) => featureUsage[b] - featureUsage[a])[0];
    const leastUsed = Object.keys(featureUsage).sort((a, b) => featureUsage[a] - featureUsage[b])[0];

    return {
      featureUsage,
      mostUsed,
      leastUsed,
      trends,
      updateReason: this.generateUpdateReason(trends, featureUsage)
    };
  }

  /**
   * Reduce assistance (user improving)
   */
  reduceAssistance(profile, analysis) {
    const updated = { ...profile };

    // Gradually reduce cognitive load reduction if user is improving
    if (analysis.trends.improvement > 15) {
      if (updated.readingPreferences.chunkSize < 8) {
        updated.readingPreferences.chunkSize += 1;
      }
    }

    // Reduce focus mode if attention is improving
    if (analysis.trends.improvement > 10) {
      updated.enabledFeatures.focusMode = false;
    }

    return updated;
  }

  /**
   * Increase assistance (user struggling)
   */
  increaseAssistance(profile, analysis) {
    const updated = { ...profile };

    // Increase cognitive load reduction
    if (updated.readingPreferences.chunkSize > 4) {
      updated.readingPreferences.chunkSize -= 1;
    }

    // Enable focus mode if not already
    if (!updated.enabledFeatures.focusMode) {
      updated.enabledFeatures.focusMode = true;
    }

    // Increase TTS if reading accuracy is low
    const recentAccuracy = analysis.trends.recentAverage || 0;
    if (recentAccuracy < 70 && !updated.enabledFeatures.tts) {
      updated.enabledFeatures.tts = true;
    }

    return updated;
  }

  /**
   * Update preferences based on usage
   */
  updatePreferences(profile, history) {
    const updated = { ...profile };

    // Adjust reading pace based on actual performance
    const recentWpm = history
      .filter(s => s.wpm)
      .slice(-5)
      .map(s => s.wpm);
    
    if (recentWpm.length > 0) {
      const avgWpm = recentWpm.reduce((a, b) => a + b, 0) / recentWpm.length;
      // Update preferred pace to match actual comfortable pace
      updated.readingPreferences.preferredPace = Math.round(avgWpm);
    }

    // Adjust attention profile based on session duration
    const recentDurations = history
      .filter(s => s.timeSpent)
      .slice(-5)
      .map(s => s.timeSpent / 60); // Convert to minutes
    
    if (recentDurations.length > 0) {
      const avgDuration = recentDurations.reduce((a, b) => a + b, 0) / recentDurations.length;
      updated.attentionProfile.focusDuration = Math.round(avgDuration);
    }

    return updated;
  }

  /**
   * Generate update reason
   */
  generateUpdateReason(trends, featureUsage) {
    if (trends.trend === 'improving') {
      return `Performance improving (${trends.improvement}% increase). Reducing assistance.`;
    } else if (trends.trend === 'declining') {
      return `Performance declining. Increasing assistance.`;
    }
    return 'Routine profile update based on usage patterns.';
  }
}

module.exports = new AdaptiveLearningEngine();
