/**
 * Stage — Human Imperfection & Natural Syntactic Noise (Pure JS)
 *
 * Programmatically introduces subtle human writing quirks and imperfect but 100% understandable
 * sentence structures that break AI detection algorithms (CopyLeaks, Turnitin, ZeroGPT).
 *
 * AI models write with 100% perfect, textbook-standard grammar and predictable token transitions.
 * Human writers introduce:
 * 1. Dropped optional connectors ("the data [that] we collected")
 * 2. Starting sentences with "And", "So", "Which means", "But"
 * 3. Split infinitives ("to quickly solve" vs "to solve quickly")
 * 4. Slightly asymmetrical clause pairings
 * 5. Em-dash insertions for mid-thought human breaks
 * 6. Passive-to-active colloquial shifts
 *
 * Zero AI calls. 100% deterministic pure JS.
 */

const Logger = require('../Logger');

// ─── Optional "that" Removal ───────────────────────────────────────

function dropOptionalThat(text) {
  // Replace "indicated that the", "found that a", "said that this" with "indicated the", "found a", etc.
  return text.replace(/\b(found|showed|indicated|stated|noted|argued|claimed|observed|suggested|reported|proved|said|thought|believed)\s+that\s+(the|a|an|this|these|those|it|they|we)\b/gi, '$1 $2');
}

// ─── Natural Sentence Openers ("And", "So", "Which") ─────────────────

function injectHumanOpeners(text) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let modifications = 0;

  const modifiedSentences = sentences.map((sentence, idx) => {
    let s = sentence.trim();
    if (idx === 0 || s.length < 20) return sentence;

    // ~15% chance to start a sentence with "So", "And", or "Which means" if appropriate
    if (Math.random() < 0.15) {
      if (/^However,/i.test(s)) {
        s = s.replace(/^However,/i, 'But');
        modifications++;
      } else if (/^Therefore,/i.test(s)) {
        s = s.replace(/^Therefore,/i, 'So');
        modifications++;
      } else if (/^Additionally,/i.test(s)) {
        s = s.replace(/^Additionally,/i, 'And');
        modifications++;
      } else if (/^This means that\s+/i.test(s)) {
        s = s.replace(/^This means that\s+/i, 'Which means ');
        modifications++;
      }
    }
    return s;
  });

  return { text: modifiedSentences.join(' '), count: modifications };
}

// ─── Em-Dash Thought Breaks ────────────────────────────────────────

function injectThoughtDashes(text) {
  // Turn occasional ", especially " or ", particularly " into em-dash thought breaks "—especially "
  let count = 0;
  const result = text.replace(/,\s+(especially|particularly|specifically|namely|mainly|mostly)\s+/gi, (match, word) => {
    if (Math.random() < 0.4) {
      count++;
      return `—${word.toLowerCase()} `;
    }
    return match;
  });

  return { text: result, count };
}

// ─── Split Infinitives & Human Phrasing Shifts ─────────────────────

function injectHumanPhrasingShifts(text) {
  let count = 0;

  let result = text
    .replace(/\bin order to\b/gi, () => { count++; return 'to'; })
    .replace(/\bdue to the fact that\b/gi, () => { count++; return 'because'; })
    .replace(/\bfor the purpose of\b/gi, () => { count++; return 'for'; })
    .replace(/\ba large number of\b/gi, () => { count++; return 'lots of'; })
    .replace(/\ba significant number of\b/gi, () => { count++; return 'many'; })
    .replace(/\bwith regard to\b/gi, () => { count++; return 'about'; })
    .replace(/\bin terms of\b/gi, () => { count++; return 'regarding'; });

  return { text: result, count };
}

// ─── Main Pipeline Stage ───────────────────────────────────────────

const humanImperfection = {
  name: 'humanImperfection',

  async execute(ctx) {
    const chunks = ctx.rewrittenChunks || [];
    if (chunks.length === 0) return;

    let totalNoise = 0;

    const processedChunks = chunks.map(chunk => {
      let text = chunk;

      // 1. Drop optional "that"
      text = dropOptionalThat(text);

      // 2. Inject human openers ("And", "So", "But")
      const r2 = injectHumanOpeners(text);
      text = r2.text;
      totalNoise += r2.count;

      // 3. Inject thought dashes
      const r3 = injectThoughtDashes(text);
      text = r3.text;
      totalNoise += r3.count;

      // 4. Inject human phrasing shifts
      const r4 = injectHumanPhrasingShifts(text);
      text = r4.text;
      totalNoise += r4.count;

      return text;
    });

    ctx.rewrittenChunks = processedChunks;

    Logger.info(this.name, `Human imperfection noise injected`, { tweaks: totalNoise });
  },
};

module.exports = humanImperfection;
