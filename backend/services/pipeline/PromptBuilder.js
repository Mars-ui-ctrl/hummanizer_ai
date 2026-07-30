/**
 * Prompt Builder Module
 *
 * Builds user-facing prompts for each pipeline stage.
 * The base humanizer persona is passed as systemInstruction in gemini.js.
 *
 * KEY INSIGHT: The framing matters enormously for AI detection.
 * - "Rewrite this" → AI paraphrases → still detectable
 * - "Read and re-express from understanding" → AI regenerates → different token distribution
 */

const CHUNK_STYLE_VARIANTS = [
  'Write with a slightly conversational academic tone — serious content, but approachable delivery.',
  'Write with the clarity of someone explaining a complex topic to a smart colleague over coffee.',
  'Write with the directness of a well-read journalist covering a technical story.',
  'Write with the thoughtful precision of a researcher who genuinely cares about the subject.',
  'Write with the engaging flow of a thesis chapter that your advisor would actually enjoy reading.',
  'Write with the natural voice of an experienced practitioner sharing real-world observations.',
];

const PromptBuilder = {
  /**
   * Build the main rewrite prompt for a chunk.
   * Uses "absorb and re-express" framing instead of "rewrite."
   */
  rewrite(chunkText, options = {}) {
    const parts = [];

    // Pick a random style variant for each chunk to prevent uniform tone
    const styleVariant = CHUNK_STYLE_VARIANTS[Math.floor(Math.random() * CHUNK_STYLE_VARIANTS.length)];
    parts.push(`STYLE NOTE: ${styleVariant}`);
    parts.push('');

    if (options.context) {
      parts.push(
        `PRECEDING SECTION (reference for smooth transition — do NOT rewrite this):`,
        `"${options.context}"`,
        ''
      );
    }

    if (options.isRetry) {
      parts.push(
        `IMPORTANT: Your previous version was too short. This time, include EVERY detail, example, and explanation from the source material. Match the original length precisely.`,
        ''
      );
    }

    // Word count for length guidance
    const approxWords = chunkText.trim().split(/\s+/).length;

    parts.push(
      `Read the following section carefully. Absorb the key facts, arguments, and details. Then write about the same content in your own natural voice — as if you studied this material and are now writing about it from memory. Cover EVERY point. Target approximately ${approxWords} words.`,
      '',
      `SOURCE MATERIAL:`,
      `---`,
      chunkText,
      `---`
    );

    return parts.join('\n');
  },

  styleRefine(chunkText, options = {}) {
    return this.rewrite(chunkText, options);
  },

  diversityPass(chunkText, options = {}) {
    return this.rewrite(chunkText, options);
  },

  finalPolish(chunkText, options = {}) {
    return this.rewrite(chunkText, options);
  },

  evaluate(originalText, candidates) {
    const parts = [
      `EVALUATION TASK: Select the candidate version that sounds most naturally human and preserves all original facts.`,
      `RESPOND ONLY WITH: SELECTED: [version number]`,
      '',
      `ORIGINAL TEXT:`,
      `---`,
      originalText,
      `---`,
      ''
    ];

    candidates.forEach((cand, i) => {
      parts.push(`VERSION ${i + 1}:`, `---`, cand, `---`, '');
    });

    return parts.join('\n');
  },

  rewriteWithFocus(chunkText, focusInstruction, options = {}) {
    return this.rewrite(chunkText, options);
  },

  editor(chunkText, options = {}) {
    return this.rewrite(chunkText, options);
  },
};

module.exports = PromptBuilder;
