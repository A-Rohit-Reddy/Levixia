import axios from 'axios'; // Ensure you have axios installed or use fetch (adapter below uses fetch, but imports are good practice if you switch)

// Use relative URL when frontend and backend are on same port (via proxy)
// Or use full URL if REACT_APP_API_URL is set
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

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

    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      config.body = JSON.stringify(options.body);
    } else if (options.body) {
      // If it is FormData, do not set Content-Type header manually (browser does it)
      // and pass body directly
      config.body = options.body;
      if (config.headers['Content-Type'] && options.body instanceof FormData) {
          delete config.headers['Content-Type'];
      }
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
   * Transcribe audio using Reverie API
   * @param {File|Blob} audioFile - Audio file
   * @param {string} language - Language code (default: 'en')
   * @returns {Promise<Object>} - Transcription result
   */
  /**
   * Transcribe audio using Reverie API
   * DIRECT FETCH IMPLEMENTATION TO FIX "FAILED TO FETCH"
   */
  async transcribeAudio(audioFile, language = 'en') {
    // 1. Prepare FormData
    const formData = new FormData();
    
    // Check type to ensure valid extension for Multer
    const extension = audioFile.type.includes('mp4') ? 'mp4' : 'webm';
    const filename = `recording.${extension}`;
    
    // Append file with filename (Critical for backend)
    formData.append('audio', audioFile, filename);
    formData.append('language', language);

    // Use relative URL if API_BASE_URL is empty (proxy mode), otherwise use full URL
    const url = API_BASE_URL 
      ? `${API_BASE_URL}/api/assistant/speech-to-text`
      : '/api/assistant/speech-to-text';

    console.log(`📡 Uploading audio to ${url} (${audioFile.size} bytes, type: ${audioFile.type})`);

    try {
      // 2. Direct Fetch (Bypassing this.request to avoid Header conflicts)
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        // IMPORTANT: Do NOT set 'Content-Type' header here. 
        // The browser automatically sets 'multipart/form-data; boundary=...'
      });

      // 3. Handle Network Errors
      if (!response.ok) {
        // Try to read error text
        const errorText = await response.text(); 
        let errorJson;
        try { errorJson = JSON.parse(errorText); } catch(e) {}
        
        const errorMessage = errorJson?.error || errorJson?.message || errorText || `Server error: ${response.status}`;
        console.error("Server responded with error:", errorMessage);
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Speech-to-text API connection failed:', error);
      // If it's a pure network error (server down, CORS), the message is usually "Failed to fetch"
      if (error.message === 'Failed to fetch') {
         throw new Error('Cannot reach server. Check if Backend is running on port 3001 and CORS is enabled.');
      }
      throw error;
    }
  }

  /**
   * Optimize font size based on reading accuracy
   * @param {string} originalText - Original passage text
   * @param {string} transcribedText - Transcribed text
   * @param {number} currentFontSize - Current font size
   * @param {number} fontSizeIncrement - Font size increment (default: 2)
   * @returns {Promise<Object>} - Optimization result
   */
  async optimizeFontSize(originalText, transcribedText, currentFontSize = 16, fontSizeIncrement = 2) {
    return this.request('/api/assistant/optimize-font-size', {
      method: 'POST',
      body: { originalText, transcribedText, currentFontSize, fontSizeIncrement }
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

  // ... (Other existing methods like analyzeWriting, analyzeSpelling, etc. can remain here)

  async analyzeWriting(userText, referenceText, userProfile) {
    return this.request('/api/assistant/analyze-writing', {
      method: 'POST',
      body: { userText, referenceText, userProfile }
    });
  }

  async generateProfile(assessmentResults, report) {
    return this.request('/api/assistant/profile', {
      method: 'POST',
      body: { assessmentResults, report }
    });
  }
}

const apiService = new ApiService();
export default apiService;