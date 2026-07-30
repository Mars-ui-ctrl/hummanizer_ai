/**
 * Prompt Builder Module
 *
 * Builds user-facing prompts for each pipeline stage.
 * Base humanizer rules are passed as systemInstruction in gemini.js.
 */

const CHUNK_STYLE_VARIANTS = [
  'Write with clear, direct academic prose — authoritative, precise, and well-structured.',
  'Write with the natural flow of a seasoned researcher presenting key findings cleanly.',
  'Write with the directness of a professional journal article — engaging yet analytical.',
  'Write with authentic human rhythm — alternating concise key points with detailed explanations.',
  'Write in an authoritative, informative tone, keeping explanation clear and evidence-based.',
];

const PromptBuilder = {
  /**
   * Build the main rewrite prompt for a chunk.
   */
  rewrite(chunkText, options = {}) {
    const parts = [];

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
        `IMPORTANT: Match the original detail level and length exactly. Cover every point without summarizing.`,
        ''
      );
    }

    const approxWords = chunkText.trim().split(/\s+/).length;

    parts.push(
      `Read the section below. Re-express every point clearly and authoritatively in natural human prose. Cover ALL facts, statistics, names, and details. Target approximately ${approxWords} words.`,
      '',
      `SOURCE TEXT:`,
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
