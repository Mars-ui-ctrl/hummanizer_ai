/**
 * Google Gemini AI Provider (with Auto 429 Rate-Limit Backoff & Model Chain)
 *
 * Rotates across active Gemini models.
 * If all models hit 429 rate limits, it automatically sleeps for 12 seconds
 * to allow Gemini's free tier RPM window to reset, then retries automatically.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { BASE_HUMANIZER_PROMPT } = require('../../config/prompt');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
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
  let hitRateLimit = false;

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
      const status = error.status || error.httpStatusCode;
      const is429 = status === 429 || error.message?.includes('429') || error.message?.includes('Quota');
      const is404 = status === 404 || error.message?.includes('404');

      if (is429) hitRateLimit = true;

      // Keep the most relevant error (prefer 429 over 404)
      if (!lastError || is429) {
        lastError = error;
      }

      console.warn(`⚠ ${modelName} ${is404 ? 'not supported (404)' : 'rate limit (429)'}, trying next model...`);

      if (!is429 && !is404 && status !== 503 && !error.message?.includes('fetch failed')) {
        throw error;
      }
    }
  }

  // If rate limits were hit, pause 12 seconds to let free-tier quota reset, then retry up to 3 times
  if (hitRateLimit && attemptNumber <= 3) {
    console.warn(`⏳ Gemini free tier rate limit reached. Pausing 12 seconds before retry attempt ${attemptNumber}/3...`);
    await sleep(12000);
    return generateText(prompt, options, attemptNumber + 1);
  }

  throw lastError;
}

module.exports = { generateText };
