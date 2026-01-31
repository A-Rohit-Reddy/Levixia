/**
 * Reverie Speech-to-Text Service
 * Integrates with Reverie API for high-quality speech transcription
 */

let ReverieClient = null;
let reverieClient = null;

// Try to load reverie-client (may be browser-only, so wrap in try-catch)
try {
  ReverieClient = require("reverie-client");
  reverieClient = new ReverieClient({
    apiKey: "c2ae883413d03b3134aed178b31122e582e0f356",
    appId: "com.rishikoff2117",
  });
  console.log('✅ ReverieClient initialized');
} catch (error) {
  console.warn('⚠️ ReverieClient not available (may be browser-only):', error.message);
  // Will use direct API call instead
}

class ReverieService {
  /**
   * Transcribe audio file to text using Reverie API
   * @param {Buffer} audioFile - Audio file buffer
   * @param {string} language - Language code (default: 'en')
   * @returns {Promise<Object>} - Transcription result
   */
  async transcribeAudio(audioFile, language = 'en') {
    try {
      console.log('🎤 Transcribing audio with Reverie API...');
      console.log(`📦 Audio buffer size: ${audioFile.length} bytes`);
      
      // Method 1: Try using ReverieClient if available
      if (reverieClient) {
        try {
          const response = await reverieClient.transcribeAudio({
            audioFile: audioFile,
            language: language,
          });

          console.log("✅ Reverie API Response:", response);

          // Extract transcript from response
          const transcript = response.transcript || response.text || response.result || response.data?.transcript || '';
          
          if (!transcript) {
            throw new Error('No transcript in response');
          }

          return {
            success: true,
            transcript: transcript.trim(),
            confidence: response.confidence || null,
            rawResponse: response
          };
        } catch (clientError) {
          console.warn('ReverieClient failed, trying direct API call:', clientError.message);
          // Fall through to direct API call
        }
      }

      // Method 2: Direct API call to Reverie (if client doesn't work)
      const FormData = require('form-data');
      const axios = require('axios');
      
      const formData = new FormData();
      formData.append('audio', audioFile, {
        filename: 'recording.webm',
        contentType: 'audio/webm'
      });
      formData.append('src_lang', language);
      formData.append('domain', 'general');

      const response = await axios.post('https://api.reverieinc.com/asr/v1/transcribe', formData, {
        headers: {
          ...formData.getHeaders(),
          'X-API-Key': 'c2ae883413d03b3134aed178b31122e582e0f356',
          'X-App-Id': 'com.rishikoff2117'
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      const responseData = response.data;

      console.log("✅ Reverie Direct API Response:", responseData);

      const transcript = responseData?.transcript || responseData?.text || responseData?.result || responseData?.data?.transcript || '';
      
      if (!transcript) {
        throw new Error('No transcript in API response');
      }

      return {
        success: true,
        transcript: transcript.trim(),
        confidence: responseData?.confidence || null,
        rawResponse: responseData
      };
    } catch (error) {
      console.error('❌ Reverie transcription error:', error);
      throw new Error(`Speech-to-text failed: ${error.message}`);
    }
  }

  /**
   * Calculate text similarity/match percentage
   * @param {string} originalText - Original text
   * @param {string} transcribedText - Transcribed text
   * @returns {number} - Match percentage (0-100)
   */
  calculateMatchPercentage(originalText, transcribedText) {
    if (!originalText || !transcribedText) return 0;

    // Normalize texts: lowercase, remove punctuation, split into words
    const normalize = (text) => 
      text.toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(w => w.length > 0);

    const originalWords = normalize(originalText);
    const transcribedWords = normalize(transcribedText);

    if (originalWords.length === 0) return 0;

    // Calculate word-level accuracy
    let matches = 0;
    const minLength = Math.min(originalWords.length, transcribedWords.length);
    
    for (let i = 0; i < minLength; i++) {
      if (originalWords[i] === transcribedWords[i]) {
        matches++;
      }
    }

    // Also check for partial matches (fuzzy matching)
    let fuzzyMatches = 0;
    for (let i = 0; i < minLength; i++) {
      const orig = originalWords[i];
      const trans = transcribedWords[i];
      
      // Check if words are similar (Levenshtein distance < 30% of word length)
      if (orig === trans) {
        fuzzyMatches++;
      } else if (this.levenshteinDistance(orig, trans) <= Math.ceil(orig.length * 0.3)) {
        fuzzyMatches += 0.5; // Partial credit for similar words
      }
    }

    // Use the better of exact match or fuzzy match
    const exactMatchPercent = (matches / originalWords.length) * 100;
    const fuzzyMatchPercent = (fuzzyMatches / originalWords.length) * 100;
    
    return Math.max(exactMatchPercent, fuzzyMatchPercent);
  }

  /**
   * Calculate Levenshtein distance between two strings
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} - Edit distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,     // deletion
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j - 1] + 1   // substitution
          );
        }
      }
    }

    return matrix[len1][len2];
  }
}

module.exports = new ReverieService();
