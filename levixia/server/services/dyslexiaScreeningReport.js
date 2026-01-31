/**
 * Comprehensive Dyslexia Screening Report Generator
 * Analyzes all assessment data and generates detailed report with severity classification
 */

const geminiService = require('./geminiService');

class DyslexiaScreeningReport {
  /**
   * Generate comprehensive dyslexia screening report
   * @param {Object} aggregatedResults - Combined results from all tests
   * @returns {Promise<Object>} - Detailed screening report
   */
  async generate(aggregatedResults) {
    const reading = aggregatedResults.reading || {};
    const spelling = aggregatedResults.spelling || {};
    const visual = aggregatedResults.visual || {};
    const cognitive = aggregatedResults.cognitive || {};

    // Extract detailed metrics
    const spellingErrors = this.extractSpellingErrors(spelling);
    const letterReversals = this.detectLetterReversals(reading, spelling);
    const readingHesitations = this.detectReadingHesitations(reading);
    const wordSpacingIssues = this.analyzeWordSpacing(reading, visual);
    const phoneticErrors = this.extractPhoneticErrors(reading, spelling);
    const readingSpeed = reading.wpm || 0;
    const writingCoherence = this.calculateWritingCoherence(spelling, reading);

    // Calculate error percentage
    const totalSpellingAttempts = spelling.errorClassifications?.length || 0;
    const errorPercentage = totalSpellingAttempts > 0 
      ? Math.round((spellingErrors.length / totalSpellingAttempts) * 100)
      : 0;

    // Determine severity level
    const severity = this.determineSeverity({
      spellingErrors: spellingErrors.length,
      errorPercentage,
      readingAccuracy: reading.accuracyPercent || 0,
      readingSpeed,
      letterReversals: letterReversals.length,
      phoneticErrors: phoneticErrors.length,
      writingCoherence
    });

    // Determine recommended assistant
    const recommendedAssistant = this.determineAssistant({
      readingAccuracy: reading.accuracyPercent || 0,
      readingSpeed,
      readingHesitations: readingHesitations.length,
      wordSpacingIssues,
      spellingErrors: spellingErrors.length,
      errorPercentage,
      writingCoherence,
      letterReversals: letterReversals.length
    });

    const prompt = `You are an expert dyslexia screening specialist. Generate a comprehensive, detailed screening report.

ASSESSMENT DATA:
${JSON.stringify(aggregatedResults, null, 2)}

DETAILED METRICS:
- Spelling Errors Count: ${spellingErrors.length}
- Error Percentage: ${errorPercentage}%
- Letter Reversals Detected: ${letterReversals.length} (${letterReversals.map(r => r.pattern).join(', ')})
- Reading Hesitations: ${readingHesitations.length}
- Word Spacing Issues: ${wordSpacingIssues ? 'Yes' : 'No'}
- Phonetic Errors: ${phoneticErrors.length}
- Reading Speed: ${readingSpeed} WPM
- Writing Coherence Score: ${writingCoherence}/100
- Severity Level: ${severity}

Generate a comprehensive report with:

1. Executive Summary (2-3 sentences, encouraging tone)
2. Detailed Metrics Breakdown:
   - Spelling mistakes count and list
   - Error percentage analysis
   - Word spacing/gaps analysis
   - Reading hesitation indicators
   - Letter reversal patterns
   - Phonetic errors identified
   - Reading speed assessment
   - Writing coherence evaluation
3. Severity Classification (Mild/Moderate/Severe) with justification
4. Recommended Assistant Type (Reading/Writing/Both) with reasoning
5. Strengths identified
6. Areas needing support
7. Personalized recommendations

IMPORTANT:
- Use encouraging, non-clinical language
- Do not provide medical diagnoses
- Focus on support strategies
- Be specific about patterns detected
- Maintain positive, supportive tone

Return JSON:
{
  "executiveSummary": "Brief encouraging summary",
  "spelling_errors": ${spellingErrors.length},
  "spelling_errors_list": ${JSON.stringify(spellingErrors.map(e => e.word || e.original))},
  "error_percentage": ${errorPercentage},
  "word_spacing_issues": ${wordSpacingIssues},
  "reading_gaps_detected": ${readingHesitations.length > 0},
  "reading_hesitation_count": ${readingHesitations.length},
  "reading_hesitation_details": ${JSON.stringify(readingHesitations)},
  "letter_reversal": ${letterReversals.length > 0},
  "letter_reversal_patterns": ${JSON.stringify(letterReversals)},
  "phonetic_errors": ${phoneticErrors.length},
  "phonetic_errors_list": ${JSON.stringify(phoneticErrors)},
  "reading_speed_wpm": ${readingSpeed},
  "reading_speed_assessment": "Assessment of reading speed",
  "writing_coherence_score": ${writingCoherence},
  "writing_coherence_assessment": "Assessment of writing coherence",
  "severity_level": "${severity}",
  "severity_justification": "Why this severity level was assigned",
  "recommended_assistant": "${recommendedAssistant}",
  "assistant_reasoning": "Why this assistant type is recommended",
  "strengths": ["strength 1", "strength 2"],
  "support_areas": ["area 1", "area 2"],
  "recommendations": [
    {
      "category": "Reading Support",
      "items": ["recommendation 1", "recommendation 2"]
    },
    {
      "category": "Writing Support",
      "items": ["recommendation 1"]
    }
  ]
}`;

    try {
      const report = await geminiService.generateJSON('dyslexia screening report', prompt);
      
      // Add calculated metrics to report
      return {
        ...report,
        spelling_errors: spellingErrors.length,
        spelling_errors_list: spellingErrors.map(e => e.word || e.original || e),
        error_percentage: errorPercentage,
        word_spacing_issues: wordSpacingIssues,
        reading_gaps_detected: readingHesitations.length > 0,
        reading_hesitation_count: readingHesitations.length,
        reading_hesitation_details: readingHesitations,
        letter_reversal: letterReversals.length > 0,
        letter_reversal_patterns: letterReversals,
        phonetic_errors: phoneticErrors.length,
        phonetic_errors_list: phoneticErrors,
        reading_speed_wpm: readingSpeed,
        writing_coherence_score: writingCoherence,
        severity_level: severity,
        recommended_assistant: recommendedAssistant
      };
    } catch (error) {
      console.error('Dyslexia screening report generation failed:', error);
      throw new Error(`AI report generation failed: ${error.message}`);
    }
  }

  /**
   * Extract spelling errors from spelling results
   */
  extractSpellingErrors(spelling) {
    const errors = [];
    
    if (spelling.errorClassifications) {
      spelling.errorClassifications.forEach(err => {
        if (err.accuracy < 100 || err.type !== 'Correct') {
          errors.push({
            word: err.word,
            attempt: err.attempt || err.typed,
            type: err.type,
            pattern: err.pattern
          });
        }
      });
    }

    return errors;
  }

  /**
   * Detect letter reversal patterns (b/d, p/q, etc.)
   */
  detectLetterReversals(reading, spelling) {
    const reversals = [];
    const reversalPatterns = [
      { pattern: 'b/d', regex: /[bd]/gi, examples: ['b', 'd'] },
      { pattern: 'p/q', regex: /[pq]/gi, examples: ['p', 'q'] },
      { pattern: 'm/w', regex: /[mw]/gi, examples: ['m', 'w'] },
      { pattern: 'n/u', regex: /[nu]/gi, examples: ['n', 'u'] }
    ];

    // Check reading transcript for reversals
    if (reading.rawTranscript) {
      const transcript = reading.rawTranscript.toLowerCase();
      reversalPatterns.forEach(rp => {
        const matches = transcript.match(rp.regex);
        if (matches && matches.length > 2) {
          // Check if there are suspicious patterns
          const words = transcript.split(/\s+/);
          words.forEach((word, idx) => {
            if (word.includes('b') || word.includes('d')) {
              // Check if it's a likely reversal
              const originalWords = (reading.originalText || '').toLowerCase().split(/\s+/);
              if (originalWords[idx]) {
                const original = originalWords[idx];
                if (word !== original && (word.includes('b') && original.includes('d') || 
                    word.includes('d') && original.includes('b'))) {
                  reversals.push({
                    pattern: 'b/d',
                    word: word,
                    expected: original,
                    position: idx
                  });
                }
              }
            }
          });
        }
      });
    }

    // Check spelling errors for reversals
    if (spelling.errorClassifications) {
      spelling.errorClassifications.forEach(err => {
        if (err.attempt && err.word) {
          const attempt = err.attempt.toLowerCase();
          const correct = err.word.toLowerCase();
          
          // Check for b/d reversals
          if ((attempt.includes('b') && correct.includes('d')) || 
              (attempt.includes('d') && correct.includes('b'))) {
            reversals.push({
              pattern: 'b/d',
              word: attempt,
              expected: correct,
              type: 'spelling'
            });
          }
          
          // Check for p/q reversals
          if ((attempt.includes('p') && correct.includes('q')) || 
              (attempt.includes('q') && correct.includes('p'))) {
            reversals.push({
              pattern: 'p/q',
              word: attempt,
              expected: correct,
              type: 'spelling'
            });
          }
        }
      });
    }

    return reversals;
  }

  /**
   * Detect reading hesitations (pauses, gaps)
   */
  detectReadingHesitations(reading) {
    const hesitations = [];
    
    if (reading.rawTranscript && reading.originalText) {
      const transcript = reading.rawTranscript.toLowerCase().split(/\s+/);
      const original = reading.originalText.toLowerCase().split(/\s+/);
      const timeElapsed = reading.timeElapsed || 0;
      const avgTimePerWord = timeElapsed / original.length;
      
      // Detect long pauses (words that took significantly longer)
      // This is a simplified detection - in real implementation, would use audio analysis
      transcript.forEach((word, idx) => {
        if (idx < original.length) {
          const expectedWord = original[idx];
          // If word doesn't match and there's a significant delay indicator
          if (word !== expectedWord) {
            hesitations.push({
              position: idx,
              word: word,
              expected: expectedWord,
              type: 'mismatch',
              indicator: 'word_substitution'
            });
          }
        }
      });

      // Check for repetitions (indicator of hesitation)
      for (let i = 1; i < transcript.length; i++) {
        if (transcript[i] === transcript[i - 1]) {
          hesitations.push({
            position: i,
            word: transcript[i],
            type: 'repetition',
            indicator: 'repeated_word'
          });
        }
      }
    }

    return hesitations;
  }

  /**
   * Analyze word spacing issues
   */
  analyzeWordSpacing(reading, visual) {
    // Check visual test for spacing/crowding issues
    if (visual.crowdingScore && visual.crowdingScore > 50) {
      return true;
    }

    // Check reading for spacing-related errors
    if (reading.visualIssues && reading.visualIssues.length > 0) {
      const spacingKeywords = ['spacing', 'crowding', 'close', 'tight', 'overlap'];
      return reading.visualIssues.some(issue => 
        spacingKeywords.some(keyword => issue.toLowerCase().includes(keyword))
      );
    }

    return false;
  }

  /**
   * Extract phonetic errors
   */
  extractPhoneticErrors(reading, spelling) {
    const phoneticErrors = [];

    // From reading analysis
    if (reading.phonologicalIssues) {
      reading.phonologicalIssues.forEach(issue => {
        phoneticErrors.push({
          source: 'reading',
          issue: issue,
          type: 'phonological'
        });
      });
    }

    // From spelling analysis
    if (spelling.errorClassifications) {
      spelling.errorClassifications.forEach(err => {
        if (err.type === 'Phonetic' || err.type === 'Phoneme-Grapheme') {
          phoneticErrors.push({
            source: 'spelling',
            word: err.word,
            attempt: err.attempt,
            type: err.type,
            pattern: err.pattern
          });
        }
      });
    }

    return phoneticErrors;
  }

  /**
   * Calculate writing coherence score (0-100)
   */
  calculateWritingCoherence(spelling, reading) {
    let score = 100;

    // Penalize for spelling errors
    const spellingAccuracy = spelling.accuracyPercent || 0;
    score = score * (spellingAccuracy / 100) * 0.4;

    // Penalize for orthographic weakness
    const orthographicWeakness = spelling.orthographicWeakness || 0;
    score = score - (orthographicWeakness * 0.3);

    // Penalize for phoneme-grapheme mismatch
    const phonemeGraphemeMismatch = spelling.phonemeGraphemeMismatch || 0;
    score = score - (phonemeGraphemeMismatch * 0.3);

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Determine severity level (Mild/Moderate/Severe)
   */
  determineSeverity(metrics) {
    const {
      spellingErrors,
      errorPercentage,
      readingAccuracy,
      readingSpeed,
      letterReversals,
      phoneticErrors,
      writingCoherence
    } = metrics;

    let severityScore = 0;

    // Spelling errors
    if (errorPercentage > 50) severityScore += 3;
    else if (errorPercentage > 30) severityScore += 2;
    else if (errorPercentage > 15) severityScore += 1;

    // Reading accuracy
    if (readingAccuracy < 60) severityScore += 3;
    else if (readingAccuracy < 75) severityScore += 2;
    else if (readingAccuracy < 85) severityScore += 1;

    // Reading speed
    if (readingSpeed < 60) severityScore += 3;
    else if (readingSpeed < 80) severityScore += 2;
    else if (readingSpeed < 100) severityScore += 1;

    // Letter reversals
    if (letterReversals > 5) severityScore += 2;
    else if (letterReversals > 2) severityScore += 1;

    // Phonetic errors
    if (phoneticErrors > 10) severityScore += 2;
    else if (phoneticErrors > 5) severityScore += 1;

    // Writing coherence
    if (writingCoherence < 40) severityScore += 2;
    else if (writingCoherence < 60) severityScore += 1;

    if (severityScore >= 8) return 'Severe';
    if (severityScore >= 5) return 'Moderate';
    return 'Mild';
  }

  /**
   * Determine recommended assistant type
   */
  determineAssistant(metrics) {
    const {
      readingAccuracy,
      readingSpeed,
      readingHesitations,
      wordSpacingIssues,
      spellingErrors,
      errorPercentage,
      writingCoherence,
      letterReversals
    } = metrics;

    let readingScore = 0;
    let writingScore = 0;

    // Reading indicators
    if (readingAccuracy < 80) readingScore += 2;
    if (readingSpeed < 100) readingScore += 1;
    if (readingHesitations > 3) readingScore += 2;
    if (wordSpacingIssues) readingScore += 1;
    if (letterReversals > 2) readingScore += 1;

    // Writing indicators
    if (spellingErrors > 5) writingScore += 2;
    if (errorPercentage > 30) writingScore += 2;
    if (writingCoherence < 60) writingScore += 2;
    if (letterReversals > 2) writingScore += 1;

    if (readingScore >= 3 && writingScore >= 3) return 'both';
    if (writingScore > readingScore) return 'writing';
    return 'reading';
  }
}

module.exports = new DyslexiaScreeningReport();
