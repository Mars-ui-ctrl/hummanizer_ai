/**
 * Stage 8 — Final Polish
 *
 * Lightweight AI pass that corrects grammar, punctuation, duplicated words,
 * repeated phrases, awkward transitions, and formatting inconsistencies.
 *
 * Does NOT perform another rewrite. Does NOT change meaning.
 */

const config = require('../../../config/pipeline');
const AIProvider = require('../AIProvider');
const PromptBuilder = require('../PromptBuilder');
const Cache = require('../Cache');
const Logger = require('../Logger');

const finalPolish = {
  name: 'finalPolish',

  async execute(ctx) {
    const chunks = ctx.rewrittenChunks;
    if (!chunks || chunks.length === 0) {
      Logger.warn(this.name, 'No chunks to polish');
      return;
    }

    const polished = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      Logger.chunkProgress(this.name, i, chunks.length);

      // Check cache
      const cached = Cache.get(chunkText, ctx.methodId, this.name);
      if (cached) {
        polished.push(cached);
        continue;
      }

      const prompt = PromptBuilder.finalPolish(chunkText);

      const result = await AIProvider.generate(prompt, {
        temperature: config.temperatures.finalPolish,
      });

      Cache.set(chunkText, ctx.methodId, this.name, result.trim());
      polished.push(result.trim());
    }

    ctx.rewrittenChunks = polished;
  },
};

module.exports = finalPolish;
