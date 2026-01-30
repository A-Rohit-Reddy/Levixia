/**
 * Gemini Service - Backend Only
 * Handles ALL Google Gemini API calls
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY || '';
    if (!apiKey) {
      console.error('❌ GOOGLE_API_KEY not found in environment');
      console.error('⚠️  Set GOOGLE_API_KEY in server/.env file');
      // Don't throw - allow server to start but AI calls will fail gracefully
      this.model = null;
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        safetySettings: [
          { category: 'HARM_CATEGORY_MEDICAL', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SELF_HARM', threshold: 'BLOCK_NONE' }
        ]
      });
      console.log('✅ Gemini service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini:', error.message);
      this.model = null;
    }
  }

  /**
   * Generic Gemini call with logging
   * @param {string} task - Task description for logging
   * @param {string} prompt - The prompt to send
   * @param {Object} options - Generation options
   * @returns {Promise<string>} - Generated text
   */
  async generate(task, prompt, options = {}) {
    if (!this.model) {
      throw new Error('Gemini service not initialized. Set GOOGLE_API_KEY in server/.env');
    }

    const startTime = Date.now();
    console.log(`🧠 Gemini invoked for ${task}`);
    console.log(`📝 Prompt length: ${prompt.length} characters`);

    try {
      const { temperature = 0.2, maxTokens = 2048 } = options;

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens
        }
      });

      const response = await result.response;
      const text = response.text();
      const duration = Date.now() - startTime;

      console.log(`✅ Gemini completed ${task} in ${duration}ms`);
      console.log(`📊 Response length: ${text.length} characters`);

      // Add artificial latency to make AI usage visible (300-700ms)
      const artificialDelay = Math.floor(Math.random() * 400) + 300;
      await new Promise(resolve => setTimeout(resolve, artificialDelay));

      return text;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Gemini failed for ${task} after ${duration}ms:`, error.message);
      throw error;
    }
  }

  /**
   * Generate structured JSON output
   * @param {string} task - Task description
   * @param {string} prompt - The prompt with JSON instructions
   * @returns {Promise<Object>} - Parsed JSON
   */
  async generateJSON(task, prompt) {
    const jsonPrompt = `${prompt}\n\nRespond ONLY with valid JSON. No markdown, no code blocks, no explanations.`;
    
    const response = await this.generate(task, jsonPrompt, { temperature: 0.1 });
    
    // Clean response
    const cleaned = response
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch (e) {
      console.error(`❌ Failed to parse JSON for ${task}:`, cleaned.substring(0, 200));
      throw new Error(`Invalid JSON response from Gemini: ${e.message}`);
    }
  }
}

// Export singleton
module.exports = new GeminiService();
