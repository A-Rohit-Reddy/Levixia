/**
 * Accessibility Engine
 * Applies visual and layout adaptations
 */

class AccessibilityEngine {
  /**
   * Apply accessibility adaptations
   * @param {string} text - Processed text
   * @param {Object} config - Accessibility configuration
   * @returns {Object} - Styled text + layout config
   */
  applyAdaptations(text, config) {
    const {
      smartSpacing = {},
      dyslexiaFont = false,
      focusMode = false,
      contrast = 'default'
    } = config;

    const layoutConfig = {
      fontFamily: dyslexiaFont ? 'OpenDyslexic, sans-serif' : 'system-ui, sans-serif',
      letterSpacing: smartSpacing.enabled ? `${(smartSpacing.letterSpacing || 1.1) * 0.05}em` : 'normal',
      wordSpacing: smartSpacing.enabled ? `${(smartSpacing.wordSpacing || 1.3) * 0.25}em` : 'normal',
      lineHeight: smartSpacing.enabled ? (smartSpacing.lineSpacing || 1.6) : 1.5,
      fontSize: '1.1rem',
      contrast: this.getContrastStyle(contrast),
      focusLine: focusMode
    };

    // Apply focus line highlighting if enabled
    let styledText = text;
    if (focusMode) {
      styledText = this.applyFocusLine(text);
    }

    return {
      styledText,
      layoutConfig,
      readingPace: config.readingPace || 120,
      metadata: {
        adaptationsApplied: [
          dyslexiaFont && 'dyslexiaFont',
          smartSpacing.enabled && 'smartSpacing',
          focusMode && 'focusMode',
          contrast !== 'default' && 'contrast'
        ].filter(Boolean)
      }
    };
  }

  /**
   * Apply focus line highlighting
   */
  applyFocusLine(text) {
    // Add focus line class to paragraphs
    return text.replace(/<p>/g, '<p class="focus-line">');
  }

  /**
   * Get contrast style
   */
  getContrastStyle(contrast) {
    const styles = {
      default: {
        backgroundColor: '#ffffff',
        color: '#000000'
      },
      high: {
        backgroundColor: '#ffffff',
        color: '#000000',
        filter: 'contrast(1.2)'
      },
      low: {
        backgroundColor: '#f5f5f5',
        color: '#333333'
      },
      dark: {
        backgroundColor: '#1a1a1a',
        color: '#e0e0e0'
      }
    };
    return styles[contrast] || styles.default;
  }

  /**
   * Generate reading pace recommendations
   * @param {Object} userProfile - User profile
   * @param {string} text - Text to read
   * @returns {Object} - Pace recommendations
   */
  generateReadingPace(userProfile, text) {
    const wordCount = text.split(/\s+/).length;
    const preferredPace = userProfile.readingPreferences?.preferredPace || 120;
    const estimatedTime = Math.round((wordCount / preferredPace) * 60); // seconds

    return {
      wordsPerMinute: preferredPace,
      estimatedTimeSeconds: estimatedTime,
      estimatedTimeMinutes: Math.round(estimatedTime / 60 * 10) / 10,
      wordCount,
      recommendedBreaks: Math.floor(estimatedTime / (userProfile.attentionProfile?.focusDuration || 20) * 60)
    };
  }
}

module.exports = new AccessibilityEngine();
