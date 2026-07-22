const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Model fallback chain.
 * Tries each model in order — if one hits rate limits or fails,
 * it falls back to the next.
 */
const MODEL_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

/**
 * Generate text using the Google Gemini API with automatic model fallback.
 * This is the ONLY file that needs to change to switch AI providers.
 *
 * @param {string} prompt - The full prompt to send to the model
 * @param {object} options - Optional config overrides
 * @returns {Promise<string>} - The generated text response
 */
async function generateText(prompt, options = {}) {
  const generationConfig = {
    temperature: options.temperature ?? 0.7,
    topP: options.topP ?? 0.9,
    maxOutputTokens: options.maxOutputTokens ?? 8192,
  };

  const models = options.model ? [options.model] : MODEL_CHAIN;
  let lastError = null;

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });

      console.log(`✓ Used model: ${modelName}`);
      return result.response.text();
    } catch (error) {
      lastError = error;
      const status = error.status || error.httpStatusCode;
      console.warn(`⚠ ${modelName} failed (${status || error.message}), trying next...`);

      // Only fallback on rate limit (429) or unavailable (503) errors
      if (status !== 429 && status !== 503) {
        throw error;
      }
    }
  }

  // All models exhausted
  throw lastError;
}

module.exports = { generateText };

