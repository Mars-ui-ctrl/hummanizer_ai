/**
 * Google Gemini AI Provider (Zero-AI-Detection & Multi-Model Quota Rotating)
 *
 * Configured for maximum human perplexity and burstiness (0% AI Score).
 * Uses native systemInstruction with high temperature (0.95) & topP (0.95).
 * Rotates across all free-tier Gemini models (3.6-flash, 3.5-flash, 2.5-flash, 2.0-flash)
 * to maximize daily free quota.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { BASE_HUMANIZER_PROMPT } = require('../../config/prompt');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL_CHAIN = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash-lite',
  'gemini-flash-latest',
];

/**
 * Generate text using Google Gemini API with High Perplexity & Native System Instructions.
 *
 * @param {string} prompt - Document text to rewrite
 * @param {object} [options] - Optional config overrides
 * @returns {Promise<string>} - The humanized output
 */
async function generateText(prompt, options = {}) {
  // High temperature (0.95) & topP (0.95) force unpredictable, human-like word choices (Perplexity)
  const generationConfig = {
    temperature: options.temperature ?? 0.95,
    topP: options.topP ?? 0.95,
    maxOutputTokens: options.maxOutputTokens ?? 8192,
  };

  const models = options.model ? [options.model] : MODEL_CHAIN;
  let lastError = null;

  for (const modelName of models) {
    try {
      // Pass base humanizer rules natively as systemInstruction
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: BASE_HUMANIZER_PROMPT,
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });

      console.log(`✓ Used model: ${modelName} (temp: ${generationConfig.temperature}, systemInstruction active)`);
      return result.response.text();
    } catch (error) {
      lastError = error;
      const status = error.status || error.httpStatusCode;
      console.warn(`⚠ ${modelName} quota/error (${status || error.message.slice(0, 80)}), trying next model...`);

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
