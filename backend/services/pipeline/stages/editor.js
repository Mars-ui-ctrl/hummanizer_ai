/**
 * Stage 6 — Editor (Merged Style Refiner + Grammar Checker)
 *
 * Single AI pass that performs both style refinement and grammar/consistency
 * correction in one call. Reduces API usage vs. two separate stages.
 *
 * Responsibilities:
 * - Improve readability, sentence flow, transitions, paragraph cohesion
 * - Correct grammar, punctuation
 * - Preserve formatting, technical terms
 * - Do NOT summarize or introduce new facts
 */

const config = require('../../../config/pipeline');
const AIProvider = require('../AIProvider');
const PromptBuilder = require('../PromptBuilder');
const Cache = require('../Cache');
const Logger = require('../Logger');

const editor = {
  name: 'editor',

  async execute(ctx) {
    const chunks = ctx.rewrittenChunks;
    if (!chunks || chunks.length === 0) {
      Logger.warn(this.name, 'No rewritten chunks to edit');
      return;
    }

    const editedChunks = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      Logger.chunkProgress(this.name, i, chunks.length);

      // Check cache
      const cached = Cache.get(chunkText, ctx.methodId, this.name);
      if (cached) {
        editedChunks.push(cached);
        continue;
      }

      // Get context from preceding chunk if available
      const context = i > 0 ? getTrailingContext(chunks[i - 1]) : '';

      const prompt = PromptBuilder.editor(chunkText, { context });

      const editedText = await AIProvider.generate(prompt, {
        temperature: config.temperatures.editor,
      });

      Cache.set(chunkText, ctx.methodId, this.name, editedText.trim());
      editedChunks.push(editedText.trim());
    }

    ctx.rewrittenChunks = editedChunks;
  },
};

/**
 * Extract trailing context from a chunk for the editor's transition reference.
 */
function getTrailingContext(text) {
  if (!text) return '';
  const paragraphs = text.trim().split(/\n\n+/);
  const last = paragraphs[paragraphs.length - 1] || '';
  const sentences = last.match(/[^.!?]+[.!?]+/g) || [last];
  const trailing = sentences.slice(-2).join(' ').trim();
  return trailing.length > 20 ? trailing : '';
}

module.exports = editor;
