/**
 * Stage 4 — Chunker
 *
 * Splits large documents into manageable chunks for AI processing.
 * Splits ONLY at paragraph boundaries. Never splits mid-sentence.
 * Includes contextual overlap between adjacent chunks.
 * Completely independent from the rewrite engine.
 */

const config = require('../../../config/pipeline');
const Logger = require('../Logger');

function getWordCount(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

/**
 * Extract trailing context (last N sentences) from a chunk
 * for continuity with the next chunk.
 */
function getTrailingContext(text) {
  if (!text) return '';
  const paragraphs = text.trim().split(/\n\n+/);
  const lastParagraph = paragraphs[paragraphs.length - 1] || '';
  const sentences = lastParagraph.match(/[^.!?]+[.!?]+/g) || [lastParagraph];
  const trailing = sentences.slice(-config.chunking.overlapSentences).join(' ').trim();
  return trailing.length > 20 ? trailing : '';
}

const chunker = {
  name: 'chunker',

  async execute(ctx) {
    // Use the cleanest available text
    const text = ctx.cleanText || ctx.extractedText || ctx.rawText || '';
    const totalWords = getWordCount(text);
    const target = config.chunking.targetWords;

    // If document is small enough, treat as single chunk
    if (totalWords <= target + 200) {
      ctx.chunks = [{
        text: text.trim(),
        context: '',
        index: 0,
        originalWordCount: totalWords,
      }];
      ctx.chunksProcessed = 1;
      Logger.info(this.name, `Single chunk (${totalWords} words)`);
      return;
    }

    // Split at paragraph boundaries
    const rawParagraphs = text.split(/\n\n+/);
    const chunks = [];
    let currentParagraphs = [];
    let currentWordCount = 0;
    let previousChunkText = '';

    for (let i = 0; i < rawParagraphs.length; i++) {
      const para = rawParagraphs[i].trim();
      if (!para) continue;

      const paraWords = getWordCount(para);
      currentParagraphs.push(para);
      currentWordCount += paraWords;

      // Lock chunk when target reached or at end of document
      if (currentWordCount >= target || i === rawParagraphs.length - 1) {
        const chunkText = currentParagraphs.join('\n\n');
        const context = getTrailingContext(previousChunkText);

        chunks.push({
          text: chunkText,
          context,
          index: chunks.length,
          originalWordCount: getWordCount(chunkText),
        });

        previousChunkText = chunkText;
        currentParagraphs = [];
        currentWordCount = 0;
      }
    }

    // Merge leftover short paragraphs into the last chunk
    if (currentParagraphs.length > 0 && chunks.length > 0) {
      const leftover = currentParagraphs.join('\n\n');
      chunks[chunks.length - 1].text += '\n\n' + leftover;
      chunks[chunks.length - 1].originalWordCount = getWordCount(chunks[chunks.length - 1].text);
    } else if (currentParagraphs.length > 0) {
      const chunkText = currentParagraphs.join('\n\n');
      chunks.push({
        text: chunkText,
        context: '',
        index: 0,
        originalWordCount: getWordCount(chunkText),
      });
    }

    ctx.chunks = chunks;
    ctx.chunksProcessed = chunks.length;

    Logger.info(this.name, `Split into ${chunks.length} chunks`, {
      totalWords,
      avgChunkWords: Math.round(totalWords / chunks.length),
    });
  },
};

module.exports = chunker;
