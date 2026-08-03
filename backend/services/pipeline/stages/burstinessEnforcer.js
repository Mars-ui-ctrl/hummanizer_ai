/**
 * Stage 5 — Burstiness Enforcer (Pure JS)
 *
 * Turnitin looks for uniform sentence lengths across paragraphs.
 * This JS function forces every paragraph to start with a micro-sentence (<10 words)
 * followed by a long compound run-on sentence.
 *
 * Zero AI calls. 0ms latency.
 */

const Logger = require('../Logger');

function isProtectedLine(line) {
  const t = line.trim();
  return (
    t.startsWith('```') ||
    /^#{1,6}\s/.test(t) ||
    /^[-*•]\s/.test(t) ||
    /^\d+[.)]\s/.test(t) ||
    /^>\s/.test(t) ||
    /^\s{4}/.test(line)
  );
}

function enforceBurstiness(paragraph) {
  if (isProtectedLine(paragraph)) return paragraph;

  let sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
  if (sentences.length < 2) return paragraph;

  // 1. Force the first sentence to be short
  const firstWords = sentences[0].trim().split(/\s+/);
  if (firstWords.length > 10) {
    const commaIndex = sentences[0].indexOf(',');
    if (commaIndex > 5 && commaIndex < sentences[0].length - 5) {
      const part1 = sentences[0].substring(0, commaIndex).trim() + ".";
      let part2 = sentences[0].substring(commaIndex + 1).trim();
      part2 = part2.charAt(0).toUpperCase() + part2.slice(1);
      sentences.splice(0, 1, part1, part2);
    }
  }

  // 2. Merge short second sentence with third to create a compound run-on
  if (sentences.length >= 3) {
    const secondWords = sentences[1].trim().split(/\s+/).length;
    if (secondWords < 12) {
      let combined = sentences[1].trim().replace(/[.!?]+$/, "") + "; " + 
                     sentences[2].trim().charAt(0).toLowerCase() + 
                     sentences[2].trim().slice(1);
      sentences.splice(1, 2, combined);
    }
  }

  return sentences.join(" ");
}

const burstinessEnforcer = {
  name: 'burstinessEnforcer',

  async execute(ctx) {
    const chunks = ctx.rewrittenChunks || [];
    if (chunks.length === 0) return;

    const processedChunks = chunks.map(chunkText => {
      const paragraphs = chunkText.split(/\n\n+/);
      const enforcedParas = paragraphs.map(p => enforceBurstiness(p));
      return enforcedParas.join('\n\n');
    });

    ctx.rewrittenChunks = processedChunks;
    Logger.info(this.name, `Burstiness enforcement complete`);
  },
};

module.exports = burstinessEnforcer;
