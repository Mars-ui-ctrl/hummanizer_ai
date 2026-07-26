/**
 * Abstract AI Provider
 *
 * Wraps the underlying AI SDK (Gemini, OpenAI, Claude, etc.)
 * behind a unified interface. Pipeline stages call AIProvider.generate()
 * and never import a specific AI SDK directly.
 *
 * To swap providers: change the require in this file.
 * No pipeline stage code needs to change.
 */

const { generateText } = require('../ai');
const Logger = require('./Logger');

const AIProvider = {
  /**
   * Generate text from a prompt using the active AI provider.
   *
   * @param {string} prompt - Full prompt text
   * @param {object} options - Generation options
   * @param {number} [options.temperature] - Sampling temperature
   * @param {number} [options.maxOutputTokens] - Max tokens in response
   * @param {string} [options.model] - Specific model override
   * @returns {Promise<string>} Generated text
   */
  async generate(prompt, options = {}) {
    const start = Date.now();

    try {
      const result = await generateText(prompt, options);
      const duration = Date.now() - start;
      Logger.debug('AIProvider', `Call completed in ${Logger.formatDuration(duration)}`);
      return result;
    } catch (err) {
      const duration = Date.now() - start;
      Logger.error('AIProvider', `Call failed after ${Logger.formatDuration(duration)}: ${err.message}`);
      throw err;
    }
  },

  /**
   * Generate multiple text outputs in parallel.
   *
   * @param {Array<{prompt: string, options: object}>} requests
   * @returns {Promise<string[]>} Array of generated text responses
   */
  async generateMultiple(requests) {
    const start = Date.now();

    const results = await Promise.all(
      requests.map(({ prompt, options }) => this.generate(prompt, options))
    );

    const duration = Date.now() - start;
    Logger.debug('AIProvider', `Parallel batch (${requests.length} calls) completed in ${Logger.formatDuration(duration)}`);
    return results;
  },
};

module.exports = AIProvider;
