/**
 * Stage 4 — Lexical Diversification Engine (Pure JS)
 *
 * AI models naturally pick the #1 most mathematically probable word.
 * This stage swaps high-probability AI words for low-probability human words.
 * Increases the document perplexity score while preserving capitalization.
 * Zero AI calls. 0ms latency.
 */

const Logger = require('../Logger');

const AI_LEXICON_MAP = {
  "furthermore": "also",
  "moreover": "plus",
  "subsequently": "later",
  "demonstrates": "shows",
  "facilitates": "helps",
  "utilize": "use",
  "utilizes": "uses",
  "utilized": "used",
  "utilizing": "using",
  "individuals": "people",
  "significant": "notable",
  "crucial": "key",
  "comprehensive": "thorough",
  "therefore": "so",
  "however": "but",
  "in addition": "additionally",
  "consequently": "so",
  "additionally": "plus",
  "nevertheless": "still",
  "promotes": "helps",
  "underscores": "highlights",
  "exemplifies": "shows"
};

function diversifyLexicon(text) {
  let count = 0;
  // Split by word boundary keeping punctuation and whitespace
  let words = text.split(/(\b)/);
  for (let i = 0; i < words.length; i++) {
    const lowerWord = words[i].toLowerCase();
    if (AI_LEXICON_MAP[lowerWord]) {
      const replacement = AI_LEXICON_MAP[lowerWord];
      count++;
      // Preserve original capitalization
      if (words[i][0] === words[i][0].toUpperCase()) {
        words[i] = replacement.charAt(0).toUpperCase() + replacement.slice(1);
      } else {
        words[i] = replacement;
      }
    }
  }
  return { text: words.join(''), count };
}

const lexicalDiversifier = {
  name: 'lexical',

  async execute(ctx) {
    const chunks = ctx.rewrittenChunks || [];
    if (chunks.length === 0) return;

    let totalSwaps = 0;

    const processedChunks = chunks.map(chunkText => {
      const { text, count } = diversifyLexicon(chunkText);
      totalSwaps += count;
      return text;
    });

    ctx.rewrittenChunks = processedChunks;
    Logger.info(this.name, `Lexical diversification complete`, { wordSwaps: totalSwaps });
  },
};

module.exports = lexicalDiversifier;
