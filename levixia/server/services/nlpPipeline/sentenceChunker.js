/**
 * Sentence Chunker Module
 * Breaks text into manageable chunks for cognitive load reduction
 */

class SentenceChunker {
  /**
   * Chunk text into smaller segments
   * @param {string} text - Input text
   * @param {Object} config - Chunking config
   * @returns {Object} - Chunked text + metadata
   */
  chunk(text, config = {}) {
    if (!config.enabled) {
      return { chunked: text, chunks: [text], metadata: { chunkCount: 1 } };
    }

    const { chunkSize = 5, method = 'words' } = config;
    const words = text.split(/\s+/).filter(Boolean);
    const chunks = [];
    const chunkMetadata = [];

    if (method === 'words') {
      // Chunk by word count
      for (let i = 0; i < words.length; i += chunkSize) {
        const chunk = words.slice(i, i + chunkSize).join(' ');
        chunks.push(chunk);
        chunkMetadata.push({
          index: chunks.length - 1,
          wordCount: chunk.split(/\s+/).length,
          startWord: i,
          endWord: Math.min(i + chunkSize - 1, words.length - 1)
        });
      }
    } else if (method === 'sentences') {
      // Chunk by sentences
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      let currentChunk = [];
      let wordCount = 0;

      for (const sentence of sentences) {
        const sentenceWords = sentence.trim().split(/\s+/).length;
        if (wordCount + sentenceWords > chunkSize && currentChunk.length > 0) {
          chunks.push(currentChunk.join(' '));
          chunkMetadata.push({
            index: chunks.length - 1,
            wordCount,
            sentenceCount: currentChunk.length
          });
          currentChunk = [];
          wordCount = 0;
        }
        currentChunk.push(sentence.trim());
        wordCount += sentenceWords;
      }

      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
        chunkMetadata.push({
          index: chunks.length - 1,
          wordCount,
          sentenceCount: currentChunk.length
        });
      }
    }

    return {
      chunked: chunks.join('\n\n'),
      chunks,
      metadata: {
        chunkCount: chunks.length,
        averageChunkSize: words.length / chunks.length,
        chunks: chunkMetadata
      }
    };
  }
}

module.exports = new SentenceChunker();
