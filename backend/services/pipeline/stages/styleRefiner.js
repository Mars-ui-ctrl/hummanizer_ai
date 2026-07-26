/**
 * Stage 5 — Style Refinement
 *
 * AI pass focused ONLY on writing style improvements:
 * flow, transitions, sentence rhythm, paragraph rhythm, readability.
 *
 * Does NOT perform another full rewrite.
 * Does NOT introduce new facts.
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

const styleRefiner = {
  name: 'styleRefiner',

  async execute(ctx) {
    const chunks = ctx.rewrittenChunks;
    if (!chunks || chunks.length === 0) {
      Logger.warn(this.name, 'No chunks to refine');
      return;
    }

    const refinedChunks = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      Logger.chunkProgress(this.name, i, chunks.length);

      // Check cache
      const cached = Cache.get(chunkText, ctx.methodId, this.name);
      if (cached) {
        refinedChunks.push(cached);
        continue;
      }

      const context = i > 0 ? getTrailingContext(chunks[i - 1]) : '';

      const prompt = PromptBuilder.styleRefine(chunkText, {
        context,
        analysis: ctx.analysis || null,
      });

      const refined = await AIProvider.generate(prompt, {
        temperature: config.temperatures.styleRefine,
      });

      Cache.set(chunkText, ctx.methodId, this.name, refined.trim());
      refinedChunks.push(refined.trim());
    }

    ctx.rewrittenChunks = refinedChunks;
  },
};

module.exports = styleRefiner;
