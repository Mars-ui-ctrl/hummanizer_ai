/**
 * Stage 3 — AI Pass 2: Perplexity Normalizer
 *
 * Takes the output from Pass 1 and applies a "2 AM stressed graduate student" voice.
 * Lowers mathematical predictability while keeping all facts, numbers, and citations identical.
 *
 * API Settings: temperature: 0.60, topP: 0.85
 */

const AIProvider = require('../AIProvider');
const Logger = require('../Logger');

function getWordCount(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

const PERPLEXITY_NORMALIZER_SYSTEM_INSTRUCTION = `You are a stressed graduate student drafting a paper at 2 AM. Read the following text and rewrite it to sound like a natural, slightly imperfect human draft. 

RULES:
1. Make the vocabulary slightly less formal (e.g., change "utilize" to "use", "individuals" to "people").
2. Introduce slight, natural phrasing variations. It should not sound perfectly polished.
3. Keep all facts, numbers, and citations identical to the input.
4. DO NOT change the core meaning. Just change the "voice."
5. Output ONLY the text.`;

const pass2Normalizer = {
  name: 'pass2Normalizer',

  async execute(ctx) {
    const chunks = ctx.rewrittenChunks || [];
    if (chunks.length === 0) {
      Logger.warn(this.name, 'No chunks to normalize');
      return;
    }

    const normalizedChunks = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      const origWordCount = getWordCount(chunkText);

      Logger.chunkProgress(this.name, i, chunks.length, { words: origWordCount });

      const prompt = `TEXT TO NORMALIZE (${origWordCount} words):\n---\n${chunkText}\n---`;

      try {
        const resultText = await AIProvider.generate(prompt, {
          temperature: 0.60,
          topP: 0.85,
          systemInstruction: PERPLEXITY_NORMALIZER_SYSTEM_INSTRUCTION,
        });

        const newWordCount = getWordCount(resultText);

        if (origWordCount > 50 && newWordCount < origWordCount * 0.70) {
          Logger.warn(this.name, `Pass 2 shrunk chunk ${i + 1} (${origWordCount} -> ${newWordCount}), keeping Pass 1 output`);
          normalizedChunks.push(chunkText);
        } else {
          normalizedChunks.push(resultText.trim());
        }
      } catch (err) {
        Logger.warn(this.name, `Pass 2 failed for chunk ${i + 1}: ${err.message}, keeping Pass 1 output`);
        normalizedChunks.push(chunkText);
      }
    }

    ctx.rewrittenChunks = normalizedChunks;
    Logger.info(this.name, `Pass 2 Perplexity Normalization complete (${normalizedChunks.length} chunks)`);
  },
};

module.exports = pass2Normalizer;
