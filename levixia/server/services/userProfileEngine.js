/**
 * User Profile Engine
 * Creates persistent learning profile from assessment results
 * Single source of truth for personalization
 */

const geminiService = require('./geminiService');

class UserProfileEngine {
  /**
   * Generate comprehensive user learning profile
   * @param {Object} assessmentResults - { cognitive, visual, reading, spelling }
   * @param {Object} report - Diagnostic report
   * @returns {Promise<Object>} - User learning profile
   */
  async generateProfile(assessmentResults, report) {
    const cognitive = assessmentResults.cognitive || {};
    const visual = assessmentResults.visual || {};
    const reading = assessmentResults.reading || {};
    const spelling = assessmentResults.spelling || {};

    const prompt = `You are an expert in personalized learning assistance. Generate a comprehensive user learning profile.

ASSESSMENT RESULTS:
Cognitive:
- Working Memory Score: ${cognitive.workingMemoryScore || cognitive.accuracy || 0}%
- Attention Score: ${cognitive.attentionScore || cognitive.accuracy || 0}%
- Executive Function: ${cognitive.executiveFunctionScore || cognitive.accuracy || 0}%
- Error Patterns: ${(cognitive.errorPatterns || []).join(', ') || 'None'}

Visual:
- Visual Stress Score: ${visual.visualStressScore || visual.accuracy || 0}%
- Pattern Recognition: ${visual.patternRecognitionScore || visual.accuracy || 0}%
- Tracking Difficulty: ${visual.trackingDifficultyIndex || 0}%
- Crowding Score: ${visual.crowdingScore || 0}%

Reading:
- Accuracy: ${reading.accuracyPercent || 0}%
- WPM: ${reading.wpm || 0}
- Error Type: ${reading.errorType || 'Unknown'}
- Phonological Issues: ${(reading.phonologicalIssues || []).length} identified
- Visual Issues: ${(reading.visualIssues || []).length} identified

Spelling:
- Accuracy: ${spelling.accuracyPercent || 0}%
- Orthographic Weakness: ${spelling.orthographicWeakness || 0}%
- Phoneme-Grapheme Mismatch: ${spelling.phonemeGraphemeMismatch || 0}%

DIAGNOSTIC REPORT:
- Level: ${report.level || 'mild'}
- Strengths: ${(report.strengths || []).join(', ')}
- Challenges: ${(report.challenges || []).join(', ')}
- Indicators: ${(report.cognitiveIndicators || []).join(', ')}

Generate a personalized learning profile with:

1. Enabled Features (true/false based on needs):
   - bionicReading: Enable if visual stress OR reading accuracy < 70%
   - dyslexiaFont: Enable if visual stress OR visual accuracy < 60%
   - smartSpacing: Enable if visual crowding OR tracking difficulty
   - tts: Enable if reading accuracy < 75% OR phonological issues
   - writingSupport: Enable if spelling accuracy < 70% OR orthographic weakness > 50%
   - cognitiveLoadReduction: Enable if cognitive load score > 60 OR attention < 70%
   - focusMode: Enable if attention < 65% OR executive function < 70%

2. Reading Preferences:
   - preferredPace: WPM recommendation (based on reading speed)
   - chunkSize: Words per chunk (5-8 based on cognitive load)
   - highlightKeywords: true/false
   - showProgress: true/false

3. Writing Preferences:
   - realTimeCorrection: true/false
   - suggestionLevel: "minimal" | "moderate" | "comprehensive"
   - grammarCheck: true/false
   - spellingCheck: true/false

4. Attention Profile:
   - focusDuration: Estimated minutes (based on attention score)
   - breakFrequency: Minutes between breaks
   - distractionReduction: true/false
   - timeTracking: true/false

5. Learning Style:
   - dominantModality: "visual" | "auditory" | "kinesthetic" | "mixed"
   - processingSpeed: "slow" | "moderate" | "fast"
   - detailPreference: "high" | "moderate" | "low"

Return JSON:
{
  "enabledFeatures": {
    "bionicReading": true,
    "dyslexiaFont": true,
    "smartSpacing": true,
    "tts": false,
    "writingSupport": true,
    "cognitiveLoadReduction": true,
    "focusMode": false
  },
  "readingPreferences": {
    "preferredPace": 120,
    "chunkSize": 6,
    "highlightKeywords": true,
    "showProgress": true
  },
  "writingPreferences": {
    "realTimeCorrection": true,
    "suggestionLevel": "moderate",
    "grammarCheck": true,
    "spellingCheck": true
  },
  "attentionProfile": {
    "focusDuration": 15,
    "breakFrequency": 5,
    "distractionReduction": true,
    "timeTracking": true
  },
  "learningStyle": {
    "dominantModality": "visual",
    "processingSpeed": "moderate",
    "detailPreference": "moderate"
  },
  "strengths": ["list from report"],
  "challenges": ["list from report"],
  "personalizationLevel": "high" | "moderate" | "low"
}`;

    try {
      const profile = await geminiService.generateJSON('user profile generation', prompt);
      
      // Validate and ensure all required fields
      return {
        enabledFeatures: {
          bionicReading: profile.enabledFeatures?.bionicReading ?? false,
          dyslexiaFont: profile.enabledFeatures?.dyslexiaFont ?? false,
          smartSpacing: profile.enabledFeatures?.smartSpacing ?? false,
          tts: profile.enabledFeatures?.tts ?? false,
          writingSupport: profile.enabledFeatures?.writingSupport ?? false,
          cognitiveLoadReduction: profile.enabledFeatures?.cognitiveLoadReduction ?? false,
          focusMode: profile.enabledFeatures?.focusMode ?? false
        },
        readingPreferences: profile.readingPreferences || {
          preferredPace: 120,
          chunkSize: 6,
          highlightKeywords: true,
          showProgress: true
        },
        writingPreferences: profile.writingPreferences || {
          realTimeCorrection: true,
          suggestionLevel: 'moderate',
          grammarCheck: true,
          spellingCheck: true
        },
        attentionProfile: profile.attentionProfile || {
          focusDuration: 20,
          breakFrequency: 5,
          distractionReduction: true,
          timeTracking: true
        },
        learningStyle: profile.learningStyle || {
          dominantModality: 'mixed',
          processingSpeed: 'moderate',
          detailPreference: 'moderate'
        },
        strengths: profile.strengths || report.strengths || [],
        challenges: profile.challenges || report.challenges || [],
        personalizationLevel: profile.personalizationLevel || 'moderate',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Profile generation failed, using rule-based fallback:', error);
      return this.generateFallbackProfile(assessmentResults, report);
    }
  }

  /**
   * Generate fallback profile using rules
   */
  generateFallbackProfile(assessmentResults, report) {
    const reading = assessmentResults.reading || {};
    const visual = assessmentResults.visual || {};
    const cognitive = assessmentResults.cognitive || {};
    const spelling = assessmentResults.spelling || {};

    const readingAccuracy = reading.accuracyPercent || 0;
    const visualAccuracy = visual.accuracy || 0;
    const visualStress = visual.visualStressScore || 0;
    const cognitiveAccuracy = cognitive.accuracy || 0;
    const spellingAccuracy = spelling.accuracyPercent || 0;

    return {
      enabledFeatures: {
        bionicReading: readingAccuracy < 70 || visualStress < 60,
        dyslexiaFont: visualAccuracy < 60 || visualStress < 60,
        smartSpacing: visualAccuracy < 70,
        tts: readingAccuracy < 75,
        writingSupport: spellingAccuracy < 70,
        cognitiveLoadReduction: cognitiveAccuracy < 70,
        focusMode: cognitiveAccuracy < 65
      },
      readingPreferences: {
        preferredPace: reading.wpm || 120,
        chunkSize: cognitiveAccuracy < 70 ? 5 : 7,
        highlightKeywords: true,
        showProgress: true
      },
      writingPreferences: {
        realTimeCorrection: spellingAccuracy < 80,
        suggestionLevel: spellingAccuracy < 70 ? 'comprehensive' : 'moderate',
        grammarCheck: true,
        spellingCheck: true
      },
      attentionProfile: {
        focusDuration: cognitiveAccuracy < 60 ? 10 : 20,
        breakFrequency: 5,
        distractionReduction: cognitiveAccuracy < 70,
        timeTracking: true
      },
      learningStyle: {
        dominantModality: 'mixed',
        processingSpeed: 'moderate',
        detailPreference: 'moderate'
      },
      strengths: report.strengths || [],
      challenges: report.challenges || [],
      personalizationLevel: 'moderate',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Update profile based on performance data
   * @param {Object} currentProfile - Current profile
   * @param {Object} performanceData - Recent performance metrics
   * @returns {Object} - Updated profile
   */
  updateProfile(currentProfile, performanceData) {
    // Simple update logic - can be enhanced with AI
    const updated = { ...currentProfile };
    updated.updatedAt = new Date().toISOString();

    // Adjust based on performance trends
    if (performanceData.readingImprovement > 10) {
      // Reduce assistance if improving
      if (updated.enabledFeatures.bionicReading) {
        // Keep but reduce intensity
      }
    }

    return updated;
  }
}

module.exports = new UserProfileEngine();
