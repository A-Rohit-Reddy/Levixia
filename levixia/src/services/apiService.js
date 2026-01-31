/**
 * API Service - Frontend
 * Handles ALL backend API calls
 * NO AI logic here - only HTTP requests
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class ApiService {
  /**
   * Generic API call
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} - Response data
   */
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Generate reading passage
   * @param {Object} userProfile - User profile
   * @returns {Promise<Object>} - Generated passage
   */
  async generateReadingPassage(userProfile = {}) {
    return this.request('/api/ai/reading-passage', {
      method: 'POST',
      body: { userProfile }
    });
  }

  /**
   * Analyze reading performance
   * @param {string} originalText - Original passage
   * @param {string} transcript - User transcript
   * @param {number} timeSeconds - Time taken
   * @returns {Promise<Object>} - Analysis results
   */
  async analyzeReading(originalText, transcript, timeSeconds) {
    return this.request('/api/ai/analyze-reading', {
      method: 'POST',
      body: { originalText, transcript, timeSeconds }
    });
  }

  /**
   * Get spelling word pool
   * @returns {Promise<Array<string>>} - Word list
   */
  async getSpellingWords() {
    const response = await this.request('/api/ai/spelling-words', {
      method: 'GET'
    });
    return response.words;
  }

  /**
   * Analyze spelling errors
   * @param {Array} spellingResults - Array of { word, typed, accuracy, errorType }
   * @returns {Promise<Object>} - Analysis results
   */
  async analyzeSpelling(spellingResults) {
    return this.request('/api/ai/analyze-spelling', {
      method: 'POST',
      body: { spellingResults }
    });
  }

  /**
   * Analyze visual test performance
   * @param {Object} rawData - Raw visual test data
   * @returns {Promise<Object>} - Analysis results
   */
  async analyzeVisual(rawData) {
    return this.request('/api/ai/analyze-visual', {
      method: 'POST',
      body: rawData
    });
  }

  /**
   * Analyze cognitive test performance
   * @param {Object} rawData - Raw cognitive test data
   * @returns {Promise<Object>} - Analysis results
   */
  async analyzeCognitive(rawData) {
    return this.request('/api/ai/analyze-cognitive', {
      method: 'POST',
      body: rawData
    });
  }

  /**
   * Generate holistic diagnostic report
   * @param {Object} aggregatedResults - Combined results from all tests
   * @returns {Promise<Object>} - Comprehensive report
   */
  async generateReport(aggregatedResults) {
    return this.request('/api/ai/generate-report', {
      method: 'POST',
      body: { aggregatedResults }
    });
  }

  // ========== ADAPTIVE ASSISTANT ENDPOINTS ==========

  /**
   * Generate user learning profile
   * @param {Object} assessmentResults - Assessment results
   * @param {Object} report - Diagnostic report
   * @returns {Promise<Object>} - User learning profile
   */
  async generateProfile(assessmentResults, report) {
    return this.request('/api/assistant/profile', {
      method: 'POST',
      body: { assessmentResults, report }
    });
  }

  /**
   * Get adaptive configuration (defect-based when report provided)
   * @param {Object} userProfile - User learning profile
   * @param {Object} input - Input data
   * @param {Object} report - Screening report (challenges, recommendedFeatures) for defect-based config
   * @returns {Promise<Object>} - Adaptive configuration
   */
  async getAdaptiveConfig(userProfile, input, report) {
    return this.request('/api/assistant/configure', {
      method: 'POST',
      body: { userProfile, input, report }
    });
  }

  /**
   * Process text with adaptive assistance
   * @param {string} text - Input text
   * @param {Object} config - Assistant configuration
   * @param {Object} userProfile - User profile
   * @returns {Promise<Object>} - Processed text and metadata
   */
  async processText(text, config, userProfile) {
    return this.request('/api/assistant/process', {
      method: 'POST',
      body: { text, config, userProfile }
    });
  }

  /**
   * Analyze writing
   * @param {string} userText - User's written text
   * @param {string} referenceText - Reference text (optional)
   * @param {Object} userProfile - User profile
   * @returns {Promise<Object>} - Analysis results
   */
  async analyzeWriting(userText, referenceText, userProfile) {
    return this.request('/api/assistant/analyze-writing', {
      method: 'POST',
      body: { userText, referenceText, userProfile }
    });
  }

  /**
   * Track performance
   * @param {string} sessionType - 'reading' or 'writing'
   * @param {Object} sessionData - Session data
   * @returns {Promise<Object>} - Tracked metrics
   */
  async trackPerformance(sessionType, sessionData) {
    return this.request('/api/assistant/track-performance', {
      method: 'POST',
      body: { sessionType, sessionData }
    });
  }

  /**
   * Update user profile
   * @param {Object} currentProfile - Current profile
   * @param {Array} performanceHistory - Performance history
   * @returns {Promise<Object>} - Updated profile
   */
  async updateProfile(currentProfile, performanceHistory) {
    return this.request('/api/assistant/update-profile', {
      method: 'POST',
      body: { currentProfile, performanceHistory }
    });
  }

  /**
   * Get performance trends
   * @param {Array} performanceHistory - Performance history
   * @returns {Promise<Object>} - Trend analysis
   */
  async getTrends(performanceHistory) {
    // Use POST for trends since we need to send data
    return this.request('/api/assistant/trends', {
      method: 'POST',
      body: { performanceHistory }
    });
  }
}

const apiService = new ApiService();
export default apiService;