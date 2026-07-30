/**
 * Stage — Idiomatic Expression & Tone Polish (Post-NLP AI Pass)
 *
 * AI-powered stage that runs AFTER the NLP transformations (entity variation
 * + sentence restructuring) to:
 *
 * 1. Replace remaining formal/stiff expressions with natural idiomatic phrasing
 * 2. Add subtle emotional markers where appropriate
 * 3. Insert natural transitional phrases between paragraphs
 * 4. Smooth any rough edges introduced by the NLP stages
 * 5. Enforce length preservation (must not summarize)
 *
 * This is the FINAL AI call — it polishes the NLP-transformed text
 * into seamless, natural human writing.
 */

const config = require('../../../config/pipeline');
const AIProvider = require('../AIProvider');
const Logger = require('../Logger');

function getWordCount(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

const IDIOM_POLISH_PROMPT = `You are performing a FINAL POLISH pass on a document that has already been rewritten.

Your job is specifically to:

1. IDIOMATIC PHRASING: Replace any remaining stiff, formal, or corporate-sounding expressions with natural, conversational alternatives. For example:
   - "initiate the process" → "get things started"
   - "facilitate communication" → "help people talk"
   - "in the event that" → "if"
   - "a significant portion of" → "a lot of"
   - "prior to" → "before"
   But ONLY where it fits the tone naturally. Don't force idioms where formal language is appropriate (technical writing, academic context).

2. EMOTIONAL MARKERS: Add occasional, subtle human touches — a brief parenthetical aside, a personal observation, a rhetorical question. Use sparingly (2-3 per page maximum).

3. TRANSITIONAL FLOW: Smooth any abrupt transitions between paragraphs. Use natural connectors like "Plus,", "On top of that,", "What's interesting is", "The thing is," — NOT formal ones like "Furthermore," or "Moreover,".

4. SMOOTH ROUGH EDGES: Fix any awkward phrasing or grammatical issues without changing the meaning or structure.

CRITICAL RULES:
- Do NOT change any facts, names, numbers, dates, or technical terms.
- Do NOT summarize or shorten the text. Preserve the EXACT same level of detail and length.
- Do NOT add a conclusion paragraph or summary at the end.
- Return ONLY the polished text. No commentary.`;

const idiomPolisher = {
  name: 'idiomPolisher',

  async execute(ctx) {
    const chunks = ctx.rewrittenChunks || [];
    if (chunks.length === 0) {
      Logger.warn(this.name, 'No chunks to polish');
      return;
    }

    const polishedChunks = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const origWordCount = getWordCount(chunk);

      Logger.chunkProgress(this.name, i, chunks.length, { words: origWordCount });

      const prompt = [
        IDIOM_POLISH_PROMPT,
        '',
        `TEXT TO POLISH (${origWordCount} words — output MUST be approximately the same length):`,
        '---',
        chunk,
        '---',
      ].join('\n');

      try {
        let polished = await AIProvider.generate(prompt, {
          temperature: 0.6,
        });

        const newWordCount = getWordCount(polished);

        // Length guard: if polish pass shrunk the text too much, keep NLP version
        if (origWordCount > 50 && newWordCount < origWordCount * 0.75) {
          Logger.warn(this.name, `Polish shrunk chunk ${i + 1} (${origWordCount} → ${newWordCount}), keeping NLP version`);
          polishedChunks.push(chunk);
        } else {
          polishedChunks.push(polished.trim());
        }
      } catch (err) {
        Logger.warn(this.name, `Polish failed for chunk ${i + 1}: ${err.message}, keeping NLP version`);
        polishedChunks.push(chunk);
      }
    }

    ctx.rewrittenChunks = polishedChunks;

    Logger.info(this.name, `Idiom & tone polish complete`, {
      chunks: polishedChunks.length,
    });
  },
};

module.exports = idiomPolisher;
