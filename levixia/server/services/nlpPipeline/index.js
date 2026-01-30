/**
 * NLP Pipeline - Main Orchestrator
 * Coordinates all NLP processing modules
 */

const textSimplifier = require('./textSimplifier');
const sentenceChunker = require('./sentenceChunker');
const keywordHighlighter = require('./keywordHighlighter');

class NLPPipeline {
  /**
   * Process text through NLP pipeline
   * @param {string} text - Input text
   * @param {Object} config - Processing configuration
   * @returns {Promise<Object>} - Processed text + metadata
   */
  async process(text, config) {
    const { processingStrategy = {}, assistantConfig = {} } = config;
    let processedText = text;
    const appliedTransforms = [];
    const metadata = {
      originalLength: text.length,
      originalWordCount: text.split(/\s+/).length
    };

    // Step 1: Simplify if needed
    if (processingStrategy.simplify) {
      console.log('📝 Applying text simplification');
      const simplified = await textSimplifier.simplify(processedText, {
        enabled: true,
        level: 'moderate',
        preserveMeaning: true
      });
      processedText = simplified.simplified;
      appliedTransforms.push('simplification');
      metadata.simplification = simplified;
    }

    // Step 2: Chunk if needed
    if (processingStrategy.chunk) {
      console.log('📦 Applying sentence chunking');
      const chunked = sentenceChunker.chunk(processedText, {
        enabled: true,
        chunkSize: processingStrategy.chunkSize || 6,
        method: 'words'
      });
      processedText = chunked.chunked;
      appliedTransforms.push('chunking');
      metadata.chunking = chunked.metadata;
    }

    // Step 3: Highlight keywords if needed
    if (processingStrategy.highlight) {
      console.log('✨ Applying keyword highlighting');
      const highlighted = await keywordHighlighter.highlight(processedText, {
        enabled: true
      });
      processedText = highlighted.highlighted;
      appliedTransforms.push('highlighting');
      metadata.highlighting = highlighted;
    }

    // Step 4: Apply bionic reading if enabled
    if (assistantConfig.bionicReading) {
      console.log('🧠 Applying bionic reading');
      processedText = this.applyBionicReading(processedText);
      appliedTransforms.push('bionicReading');
    }

    metadata.processedLength = processedText.length;
    metadata.processedWordCount = processedText.split(/\s+/).length;
    metadata.appliedTransforms = appliedTransforms;

    return {
      processedText,
      metadata
    };
  }

  /**
   * Apply bionic reading (bold first part of words)
   */
  applyBionicReading(text) {
    return text.replace(/\b(\w{1,3})(\w+)\b/g, (match, first, rest) => {
      if (rest.length === 0) return first;
      return `<b>${first}</b>${rest}`;
    });
  }

  /**
   * Analyze writing for corrections
   * @param {string} userText - User's written text
   * @param {string} referenceText - Reference text (optional)
   * @returns {Promise<Object>} - Corrections and suggestions
   */
  async analyzeWriting(userText, referenceText = null) {
    // This would integrate with grammar/spelling checkers
    // For now, return basic structure
    return {
      spellingErrors: [],
      grammarErrors: [],
      suggestions: [],
      accuracy: referenceText ? this.calculateAccuracy(userText, referenceText) : null
    };
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
}

module.exports = new NLPPipeline();
