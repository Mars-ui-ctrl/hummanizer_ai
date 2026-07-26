/**
 * Stage 1 — Text Extractor
 *
 * Normalizes input text and detects structural elements
 * (headings, lists, numbering) for downstream preservation.
 * For text input, this is a lightweight structural pass.
 * PDF extraction is already handled by the upload route.
 */

const Logger = require('../Logger');

const extractor = {
  name: 'extractor',

  async execute(ctx) {
    let text = ctx.rawText || '';

    // Normalize line endings
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Detect and tag structural elements for downstream stages
    const lines = text.split('\n');
    const headings = [];
    const listLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Detect headings: all-caps lines, lines ending with colon, short lines in title case
      if (
        (line.length < 80 && line === line.toUpperCase() && /[A-Z]/.test(line)) ||
        /^#{1,6}\s/.test(line) ||
        /^\d+\.\s+[A-Z]/.test(line) && line.length < 80
      ) {
        headings.push({ index: i, text: line });
      }

      // Detect list items
      if (/^[\-\*\•]\s/.test(line) || /^\d+[\.\)]\s/.test(line)) {
        listLines.push(i);
      }
    }

    ctx.extractedText = text.trim();
    ctx.structure = {
      headings,
      listLineIndices: listLines,
      totalLines: lines.length,
    };

    Logger.info(this.name, `Extracted ${lines.length} lines, ${headings.length} headings, ${listLines.length} list items`);
  },
};

module.exports = extractor;
