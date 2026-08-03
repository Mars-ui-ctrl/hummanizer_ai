/**
 * Stage 7 — Document Assembler (Pure JS)
 *
 * Merges processed chunks while preserving:
 * - Original chunk order
 * - Clean double-newline paragraph spacing (\n\n)
 * - Headings and list structures
 */

const Logger = require('../Logger');

const assembler = {
  name: 'assembler',

  async execute(ctx) {
    const chunks = ctx.rewrittenChunks || [];

    if (chunks.length === 0) {
      ctx.result = ctx.cleanText || ctx.extractedText || ctx.rawText || '';
      Logger.warn(this.name, 'No rewritten chunks to assemble, using input text fallback');
      return;
    }

    const cleanedChunks = chunks.map(chunk => {
      let t = (chunk || '').trim();
      t = t.replace(/\n{3,}/g, '\n\n');
      return t;
    });

    const finalDocument = cleanedChunks.join('\n\n').trim();
    ctx.result = finalDocument;

    Logger.info(this.name, `Assembled ${chunks.length} chunk(s) into final document (${finalDocument.length} chars)`);
  },
};

module.exports = assembler;
