/**
 * Document Chunking & Pipeline Service
 *
 * Handles splitting large documents (5,000+ words) into manageable chunks,
 * passing each chunk through the selected rewrite engine with context overlap,
 * verifying output length, and reassembling the rewritten chunks into a seamless document.
 */

const TARGET_CHUNK_WORDS = 900;
const MIN_CHUNK_WORDS = 300;

/**
 * Count approximate words in a text block.
 */
function getWordCount(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

/**
 * Extract trailing context (last 2 sentences or last ~50 words)
 * from a text block to pass to the next chunk for continuity.
 */
function getPrecedingContext(text) {
  if (!text) return '';
  const paragraphs = text.trim().split(/\n\n+/);
  const lastParagraph = paragraphs[paragraphs.length - 1] || '';
  const sentences = lastParagraph.match(/[^.!?]+[.!?]+/g) || [lastParagraph];
  // Take last 1-2 sentences
  const trailingSentences = sentences.slice(-2).join(' ').trim();
  return trailingSentences.length > 20 ? trailingSentences : '';
}

/**
 * Split text into chunks at natural paragraph boundaries (\n\n).
 * Never breaks in the middle of a sentence or paragraph.
 *
 * @param {string} text - Full input text
 * @returns {Array<{text: string, context: string}>} - Array of chunk objects with preceding context
 */
function splitIntoChunks(text) {
  const totalWords = getWordCount(text);

  // If text is short (under ~1,000 words), treat as single chunk
  if (totalWords <= TARGET_CHUNK_WORDS + 200) {
    return [{ text: text.trim(), context: '' }];
  }

  // Split at double newlines (paragraph boundaries)
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

    // When cumulative word count reaches or exceeds target, lock chunk
    if (currentWordCount >= TARGET_CHUNK_WORDS || i === rawParagraphs.length - 1) {
      const chunkText = currentParagraphs.join('\n\n');
      const context = getPrecedingContext(previousChunkText);

      chunks.push({
        text: chunkText,
        context,
      });

      previousChunkText = chunkText;
      currentParagraphs = [];
      currentWordCount = 0;
    }
  }

  // If there are leftover paragraphs (e.g. last paragraph was small), merge into last chunk
  if (currentParagraphs.length > 0 && chunks.length > 0) {
    const leftoverText = currentParagraphs.join('\n\n');
    chunks[chunks.length - 1].text += '\n\n' + leftoverText;
  } else if (currentParagraphs.length > 0) {
    chunks.push({
      text: currentParagraphs.join('\n\n'),
      context: '',
    });
  }

  return chunks;
}

/**
 * Process a document through the chunking pipeline using a specific engine's rewrite function.
 * Enforces length preservation: if a rewritten chunk shrinks significantly (<70% of original),
 * it automatically retries with a strict preservation prompt.
 *
 * @param {string} fullText - Complete document text
 * @param {Function} engineRewriteFn - Function (chunkText, contextText, isRetry) => Promise<string>
 * @returns {Promise<string>} - Fully reassembled rewritten document
 */
async function processDocumentPipeline(fullText, engineRewriteFn) {
  const chunks = splitIntoChunks(fullText);

  console.log(`📄 Pipeline processing document (${getWordCount(fullText)} words) in ${chunks.length} chunk(s)...`);

  const rewrittenChunks = [];

  for (let i = 0; i < chunks.length; i++) {
    const { text: chunkText, context } = chunks[i];
    const origWordCount = getWordCount(chunkText);

    console.log(`   └─ Processing chunk ${i + 1}/${chunks.length} (${origWordCount} words)...`);

    // Pass 1: standard rewrite
    let rewrittenText = await engineRewriteFn(chunkText, context, false);
    let newWordCount = getWordCount(rewrittenText);

    // Length check: if rewritten chunk shrunk by more than 30%, retry once with strict preservation flag
    if (origWordCount > 100 && newWordCount < origWordCount * 0.7) {
      console.warn(`   ⚠️ Chunk ${i + 1} shrunk too much (${origWordCount} -> ${newWordCount} words). Retrying with strict detail preservation...`);
      try {
        const retriedText = await engineRewriteFn(chunkText, context, true);
        const retriedWordCount = getWordCount(retriedText);
        if (retriedWordCount > newWordCount) {
          rewrittenText = retriedText;
          newWordCount = retriedWordCount;
          console.log(`   ✓ Retry recovered length: ${newWordCount} words`);
        }
      } catch (err) {
        console.warn(`   ⚠️ Retry failed, keeping original rewrite: ${err.message}`);
      }
    }

    rewrittenChunks.push(rewrittenText.trim());
  }

  // Reassemble chunks with clean paragraph separation
  const finalDocument = rewrittenChunks.join('\n\n');
  const finalWordCount = getWordCount(finalDocument);
  console.log(`✨ Document completed! Original: ${getWordCount(fullText)} words ➔ Output: ${finalWordCount} words`);

  return finalDocument;
}

module.exports = {
  getWordCount,
  splitIntoChunks,
  processDocumentPipeline,
};
