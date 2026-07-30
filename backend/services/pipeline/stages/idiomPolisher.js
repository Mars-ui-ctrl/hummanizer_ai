/**
 * Stage — Final Human Polish (Post-NLP AI Pass)
 *
 * The FINAL AI pass that runs AFTER all NLP transformations.
 * Uses an editor system instruction to ensure clean, natural human prose.
 */

const AIProvider = require('../AIProvider');
const Logger = require('../Logger');

function getWordCount(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

const POLISH_SYSTEM_INSTRUCTION = `You are an expert academic and professional copyeditor making a final polish pass.

Editing Rules:
- Remove any sentence that sounds robotic or AI-generated.
- Remove stiff transition words (Furthermore, Moreover, Consequently) — replace with smooth sentence transitions or direct statements.
- Never add conversational filler phrases ("I mean,", "you know,", "it's pretty clear that", "which is great,").
- Ensure sentence lengths vary naturally within each paragraph.
- PRESERVE length, detail level, numbers, dates, locations, names, and technical terms.
- Return ONLY the polished text.`;

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
        `Polish this section (${origWordCount} words). Keep the exact same length and details:`,
        '',
        chunk,
      ].join('\n');

      try {
        let polished = await AIProvider.generate(prompt, {
          temperature: 0.50,
          systemInstruction: POLISH_SYSTEM_INSTRUCTION,
        });

        const newWordCount = getWordCount(polished);

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
