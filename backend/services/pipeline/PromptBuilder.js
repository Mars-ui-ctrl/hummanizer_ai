/**
 * Prompt Builder Module
 *
 * Prepares document text chunks for AI generation.
 * Base humanizer rules are passed natively as `systemInstruction` in gemini.js.
 */

const { BASE_HUMANIZER_PROMPT } = require('../../config/prompt');

const PromptBuilder = {
  /**
   * Get base humanizer prompt.
   */
  getBasePrompt() {
    return BASE_HUMANIZER_PROMPT;
  },

  /**
   * Build text payload for AI generation.
   *
   * @param {string} chunkText - Document chunk to rewrite
   * @param {object} [options] - Additional options (e.g. context, retry flag)
   * @returns {string} The formatted chunk payload
   */
  rewrite(chunkText, options = {}) {
    const parts = [];

    if (options.context) {
      parts.push(
        `PRECEDING CONTEXT (for transition reference only):`,
        `"${options.context}"`,
        ''
      );
    }

    if (options.isRetry) {
      parts.push(
        `NOTE: Match original length and detail level exactly. Do NOT summarize.`,
        ''
      );
    }

    parts.push(
      `DOCUMENT TEXT TO REWRITE:`,
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
      `EVALUATION TASK: Select the candidate version that sounds most natural, human, and faithful to original facts.`,
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
