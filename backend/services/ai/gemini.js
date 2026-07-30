/**
 * Google Gemini AI Provider
 *
 * Uses native systemInstruction for persona-based humanization.
 * Temperature 0.72 (not 0.95) — high enough for natural variety,
 * low enough to avoid incoherent phrasings that detectors flag.
 *
 * Rotates across available Gemini models to maximize daily free quota.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { BASE_HUMANIZER_PROMPT } = require('../../config/prompt');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

/**
 * Generate text using Google Gemini API with persona-based system instruction.
 *
 * @param {string} prompt - Document text to process
 * @param {object} [options] - Optional config overrides
 * @returns {Promise<string>} - The humanized output
 */
async function generateText(prompt, options = {}) {
  const generationConfig = {
    temperature: options.temperature ?? 0.72,
    topP: options.topP ?? 0.90,
    maxOutputTokens: options.maxOutputTokens ?? 8192,
  };

  // Allow callers to pass a custom system instruction, otherwise use base
  const systemInstruction = options.systemInstruction || BASE_HUMANIZER_PROMPT;

  const models = options.model ? [options.model] : MODEL_CHAIN;
  let lastError = null;

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });

      console.log(`✓ Used model: ${modelName} (temp: ${generationConfig.temperature})`);
      return result.response.text();
    } catch (error) {
      lastError = error;
      const status = error.status || error.httpStatusCode;
      console.warn(`⚠ ${modelName} error (${status || error.message.slice(0, 80)}), trying next...`);

      if (
        status !== 429 &&
        status !== 503 &&
        status !== 404 &&
        !error.message?.includes('404') &&
        !error.message?.includes('429') &&
        !error.message?.includes('fetch failed')
      ) {
        throw error;
      }
    }
  }

  throw lastError;
}

module.exports = { generateText };
