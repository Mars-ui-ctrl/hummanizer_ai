/**
 * Stage — Final Human Polish (Post-NLP AI Pass)
 *
 * The FINAL AI pass that runs AFTER all NLP transformations.
 * Uses a DIFFERENT system instruction than the main rewriter to create
 * a second layer of token distribution variation.
 *
 * This stage specifically targets:
 * 1. Remaining AI-sounding sentence constructions
 * 2. Overly uniform paragraph structures
 * 3. Mechanical transitions between ideas
 * 4. Generic academic filler phrases
 */

const AIProvider = require('../AIProvider');
const Logger = require('../Logger');

function getWordCount(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

// This uses a DIFFERENT persona than the main rewriter to create variation
const POLISH_SYSTEM_INSTRUCTION = `You are a sharp-eyed human editor making a final pass on a document. Your job is NOT to rewrite — the writing is already done. You're just smoothing rough spots and making it sound more natural.

Rules for your editing pass:
- Fix any sentence that sounds robotic, stiff, or AI-generated
- Replace formal connectors (Furthermore, Moreover, Additionally, Consequently) with natural ones (Plus, Also, On top of that, So, And)
- Break up any paragraph that has too-uniform sentence lengths
- Add an occasional dash, parenthetical aside, or short fragment for natural rhythm
- If two sentences in a row start the same way, fix the second one
- KEEP the same length — do not cut or summarize anything
- KEEP all facts, numbers, names, and technical terms exactly as they are
- Return ONLY the edited text`;

const idiomPolisher = {
  name: 'idiomPolisher',

  async execute(ctx) {
    const chunks = ctx.rewrittenChunks || [];
    if (chunks.length === 0) {
      Logger.warn(this.name, 'No chunks to polish');
      return;
    }

    const polishedChunks = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const origWordCount = getWordCount(chunk);

      Logger.chunkProgress(this.name, i, chunks.length, { words: origWordCount });

      const prompt = [
        `Edit this section (${origWordCount} words). Keep the same length. Fix anything that sounds AI-generated:`,
        '',
        chunk,
      ].join('\n');

      try {
        let polished = await AIProvider.generate(prompt, {
          temperature: 0.55,
          systemInstruction: POLISH_SYSTEM_INSTRUCTION,
        });

        const newWordCount = getWordCount(polished);

        // Length guard: if polish pass shrunk the text too much, keep previous version
        if (origWordCount > 50 && newWordCount < origWordCount * 0.75) {
          Logger.warn(this.name, `Polish shrunk chunk ${i + 1} (${origWordCount} → ${newWordCount}), keeping previous`);
          polishedChunks.push(chunk);
        } else {
          polishedChunks.push(polished.trim());
        }
      } catch (err) {
        Logger.warn(this.name, `Polish failed for chunk ${i + 1}: ${err.message}, keeping previous`);
        polishedChunks.push(chunk);
      }
    }

    ctx.rewrittenChunks = polishedChunks;

    Logger.info(this.name, `Final human polish complete`, {
      chunks: polishedChunks.length,
    });
  },
};

module.exports = idiomPolisher;
