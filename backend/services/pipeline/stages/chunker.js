/**
 * Stage 1 — Semantic Chunker (Pure JS)
 *
 * Splits documents at natural paragraph boundaries (\n\n). Never splits mid-sentence.
 * Target chunk size: 800-1000 words.
 * Includes a 1-sentence trailing overlap for context continuity.
 */

const config = require('../../../config/pipeline');
const Logger = require('../Logger');

function getWordCount(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

function getTrailingSentence(text) {
  if (!text) return '';
  const paragraphs = text.trim().split(/\n\n+/);
  const lastParagraph = paragraphs[paragraphs.length - 1] || '';
  const sentences = lastParagraph.match(/[^.!?]+[.!?]+/g) || [lastParagraph];
  const lastSentence = (sentences[sentences.length - 1] || '').trim();
  return lastSentence.length > 15 ? lastSentence : '';
}

const chunker = {
  name: 'chunker',

  async execute(ctx) {
    const text = (ctx.cleanText || ctx.extractedText || ctx.rawText || '').trim();
    const totalWords = getWordCount(text);
    const target = config.chunking.targetWords || 900;

    // Small document -> single chunk
    if (totalWords <= target + 200) {
      ctx.chunks = [{
        text,
        context: '',
        index: 0,
        originalWordCount: totalWords,
      }];
      ctx.chunksProcessed = 1;
      Logger.info(this.name, `Single semantic chunk (${totalWords} words)`);
      return;
    }

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

      if (currentWordCount >= target || i === rawParagraphs.length - 1) {
        const chunkText = currentParagraphs.join('\n\n');
        const context = getTrailingSentence(previousChunkText);

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

    // Merge leftover short paragraphs into last chunk
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

    Logger.info(this.name, `Split into ${chunks.length} semantic chunks`, {
      totalWords,
      avgChunkWords: Math.round(totalWords / chunks.length),
    });
  },
};

module.exports = chunker;
