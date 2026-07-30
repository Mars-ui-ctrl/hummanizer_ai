/**
 * Google Gemini AI Provider (with Auto 429 Rate-Limit Backoff & Model Chain)
 *
 * Rotates across available Gemini models.
 * If all models hit 429 rate limits, it automatically sleeps for the requested delay
 * (5-10 seconds) and retries automatically instead of failing the pipeline.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { BASE_HUMANIZER_PROMPT } = require('../../config/prompt');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-pro',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate text using Google Gemini API with rate-limit backoff.
 *
 * @param {string} prompt - Document text to process
 * @param {object} [options] - Optional config overrides
 * @returns {Promise<string>} - The humanized output
 */
async function generateText(prompt, options = {}, attemptNumber = 1) {
  const generationConfig = {
    temperature: options.temperature ?? 0.72,
    topP: options.topP ?? 0.90,
    maxOutputTokens: options.maxOutputTokens ?? 8192,
  };

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
      console.warn(`⚠ ${modelName} rate/quota limit (${status || error.message.slice(0, 80)}), trying next model...`);

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

  // If all models in the chain hit rate limits (429/503), wait 9s and retry up to 2 times
  if (attemptNumber <= 2) {
    console.warn(`⏳ All Gemini models rate-limited (429). Pausing 9 seconds before retry attempt ${attemptNumber + 1}...`);
    await sleep(9000);
    return generateText(prompt, options, attemptNumber + 1);
  }

  throw lastError;
}

module.exports = { generateText };
