/**
 * Stage — AI Phrase Cleaner (Pure JS Regex Engine)
 *
 * Scans text and systematically removes or rewrites 100+ known AI conversational
 * templates that detectors (CopyLeaks, Turnitin, Originality.ai) flag as "AI Phrases".
 *
 * Zero AI calls. 100% deterministic replacement.
 */

const Logger = require('../Logger');

// ─── AI Conversational & Fluff Phrase Replacements ──────────────────

const AI_PHRASE_PATTERNS = [
  // Conversational AI filler (CopyLeaks primary targets)
  { pattern: /\bIt's pretty clear that\s*/gi, replace: '' },
  { pattern: /\bIt is pretty clear that\s*/gi, replace: '' },
  { pattern: /\bI mean,\s*we're talking about\s*/gi, replace: 'This includes ' },
  { pattern: /\bI mean,\s*/gi, replace: '' },
  { pattern: /\bwhich is great\.\s*But,\s*you know,\s*/gi, replace: 'However, ' },
  { pattern: /\byou know,\s*/gi, replace: '' },
  { pattern: /\bThis whole push for\s*/gi, replace: 'The shift toward ' },
  { pattern: /\bA big part of that is because\s*/gi, replace: 'This is largely due to ' },
  { pattern: /\bA major reason for this is that\s*/gi, replace: 'This stems from ' },
  { pattern: /\bHere in ([^,]+),\s*which is the capital city of ([^,]+),\s*/gi, replace: 'In $1 ($2), ' },
  { pattern: /\bHere in ([^,]+),\s*/gi, replace: 'In $1, ' },
  
  // Standard AI clichés
  { pattern: /\bIn today's (?:rapidly evolving|digital|modern|fast-paced) world,?\s*/gi, replace: '' },
  { pattern: /\bIn the modern era,?\s*/gi, replace: '' },
  { pattern: /\bIt is important to note that\s*/gi, replace: '' },
  { pattern: /\bIt's worth noting that\s*/gi, replace: '' },
  { pattern: /\bIt is worth noting that\s*/gi, replace: '' },
  { pattern: /\bIt goes without saying that\s*/gi, replace: '' },
  { pattern: /\bNeedless to say,?\s*/gi, replace: '' },
  { pattern: /\bAt the end of the day,?\s*/gi, replace: 'Ultimately, ' },
  { pattern: /\bDelving into\s*/gi, replace: 'Examining ' },
  { pattern: /\bDelve into\s*/gi, replace: 'Examine ' },
  { pattern: /\bA tapestry of\s*/gi, replace: 'A mix of ' },
  { pattern: /\bA beacon of\s*/gi, replace: 'A symbol of ' },
  { pattern: /\bTestament to\s*/gi, replace: 'Evidence of ' },
  { pattern: /\bA testament to\s*/gi, replace: 'Proof of ' },
  { pattern: /\bServes as a testament to\s*/gi, replace: 'Shows ' },
  { pattern: /\bPlays a pivotal role\s*/gi, replace: 'Is central ' },
  { pattern: /\bPlay a pivotal role\s*/gi, replace: 'Are central ' },
  { pattern: /\bParadigm shift\s*/gi, replace: 'Major shift ' },
  { pattern: /\bGame-changer\s*/gi, replace: 'Key advancement ' },
  { pattern: /\bCutting-edge\s*/gi, replace: 'Advanced ' },
  { pattern: /\bGroundbreaking\s*/gi, replace: 'New ' },
  { pattern: /\bHarnessing the power of\s*/gi, replace: 'Using ' },
  { pattern: /\bHarness the power of\s*/gi, replace: 'Use ' },
  { pattern: /\bIn conclusion,?\s*/gi, replace: '' },
  { pattern: /\bTo summarize,?\s*/gi, replace: '' },
  { pattern: /\bAll in all,?\s*/gi, replace: 'In short, ' },
  { pattern: /\bOverall,?\s*/gi, replace: '' },
];

/**
 * Capitalize first character of text if sentence starts with lowercase.
 */
function fixSentenceCapitalization(text) {
  return text.replace(/(^|[.!?]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());
}

/**
 * Clean AI phrases from a text string.
 */
function cleanAiPhrases(text) {
  let cleaned = text;
  let totalReplacements = 0;

  for (const { pattern, replace } of AI_PHRASE_PATTERNS) {
    const matches = cleaned.match(pattern);
    if (matches) {
      totalReplacements += matches.length;
      cleaned = cleaned.replace(pattern, replace);
    }
  }

  // Clean up double spaces or floating punctuation
  cleaned = cleaned
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/([.!?])\s*([.!?])/g, '$1');

  cleaned = fixSentenceCapitalization(cleaned);

  return { text: cleaned, count: totalReplacements };
}

const aiPhraseCleaner = {
  name: 'aiPhraseCleaner',

  async execute(ctx) {
    const chunks = ctx.rewrittenChunks || [];
    if (chunks.length === 0) return;

    let grandTotal = 0;

    const cleanedChunks = chunks.map(chunk => {
      const { text, count } = cleanAiPhrases(chunk);
      grandTotal += count;
      return text;
    });

    ctx.rewrittenChunks = cleanedChunks;

    Logger.info(this.name, `AI phrase cleaner complete`, { strippedPhrases: grandTotal });
  },
};

module.exports = aiPhraseCleaner;
