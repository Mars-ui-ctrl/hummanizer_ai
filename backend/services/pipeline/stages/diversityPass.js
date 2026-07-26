/**
 * Stage 6 — Diversity Pass
 *
 * AI-powered structural diversity transformation.
 * Changes sentence openings, reorders clauses, alternates active/passive,
 * varies sentence length, and introduces natural rhythm variation.
 *
 * Does NOT change meaning or introduce new facts.
 */

const config = require('../../../config/pipeline');
const AIProvider = require('../AIProvider');
const PromptBuilder = require('../PromptBuilder');
const Cache = require('../Cache');
const Logger = require('../Logger');

function getTrailingContext(text) {
  if (!text) return '';
  const paragraphs = text.trim().split(/\n\n+/);
  const last = paragraphs[paragraphs.length - 1] || '';
  const sentences = last.match(/[^.!?]+[.!?]+/g) || [last];
  const trailing = sentences.slice(-2).join(' ').trim();
  return trailing.length > 20 ? trailing : '';
}

const diversityPass = {
  name: 'diversityPass',

  async execute(ctx) {
    const chunks = ctx.rewrittenChunks;
    if (!chunks || chunks.length === 0) {
      Logger.warn(this.name, 'No chunks for diversity pass');
      return;
    }

    const diversified = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      Logger.chunkProgress(this.name, i, chunks.length);

      // Check cache
      const cached = Cache.get(chunkText, ctx.methodId, this.name);
      if (cached) {
        diversified.push(cached);
        continue;
      }

      const context = i > 0 ? getTrailingContext(chunks[i - 1]) : '';

      const prompt = PromptBuilder.diversityPass(chunkText, { context });

      const result = await AIProvider.generate(prompt, {
        temperature: config.temperatures.diversityPass,
      });

      Cache.set(chunkText, ctx.methodId, this.name, result.trim());
      diversified.push(result.trim());
    }

    ctx.rewrittenChunks = diversified;
  },
};

module.exports = diversityPass;
