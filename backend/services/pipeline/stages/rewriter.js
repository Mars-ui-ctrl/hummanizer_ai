/**
 * Stage 4 — AI Rewriter
 *
 * Core AI rewrite engine. Rewrites EVERY sentence — not just selected ones.
 * Processes each chunk independently through AIProvider with analysis-aware prompts.
 * Uses chunk-level caching.
 */

const config = require('../../../config/pipeline');
const AIProvider = require('../AIProvider');
const PromptBuilder = require('../PromptBuilder');
const Cache = require('../Cache');
const Logger = require('../Logger');

function getWordCount(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

const rewriter = {
  name: 'rewriter',

  async execute(ctx) {
    const chunks = ctx.chunks;
    if (!chunks || chunks.length === 0) {
      Logger.warn(this.name, 'No chunks to rewrite');
      return;
    }

    const rewrittenChunks = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      Logger.chunkProgress(this.name, i, chunks.length, { words: chunk.originalWordCount });

      // Check cache
      const cached = Cache.get(chunk.text, ctx.methodId, this.name);
      if (cached) {
        rewrittenChunks.push(cached);
        continue;
      }

      const prompt = PromptBuilder.rewrite(chunk.text, {
        context: chunk.context,
        analysis: ctx.analysis || null,
        profile: ctx.analysis ? ctx.analysis.writingProfile : undefined,
      });

      let rewrittenText = await AIProvider.generate(prompt, {
        temperature: config.temperatures.rewrite,
      });

      let newWordCount = getWordCount(rewrittenText);

      // Length guard: retry if output is outside ±10% tolerance
      if (chunk.originalWordCount > 50 && newWordCount < chunk.originalWordCount * config.validation.minWordRatio) {
        Logger.retry(this.name, i, 1, `Shrunk from ${chunk.originalWordCount} to ${newWordCount} words`);
        ctx.retries = (ctx.retries || 0) + 1;

        try {
          const retryPrompt = PromptBuilder.rewrite(chunk.text, {
            context: chunk.context,
            analysis: ctx.analysis || null,
            isRetry: true,
          });

          const retriedText = await AIProvider.generate(retryPrompt, {
            temperature: config.temperatures.rewrite,
          });

          const retriedCount = getWordCount(retriedText);
          if (retriedCount > newWordCount) {
            rewrittenText = retriedText;
            newWordCount = retriedCount;
            Logger.info(this.name, `Retry recovered: ${newWordCount} words`);
          }
        } catch (err) {
          Logger.warn(this.name, `Retry failed: ${err.message}`);
        }
      }

      Cache.set(chunk.text, ctx.methodId, this.name, rewrittenText.trim());
      rewrittenChunks.push(rewrittenText.trim());
    }

    ctx.rewrittenChunks = rewrittenChunks;
  },
};

module.exports = rewriter;
