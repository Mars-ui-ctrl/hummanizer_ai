/**
 * Google Gemini AI Provider (with Dynamic 429 Rate-Limit Recovery)
 *
 * Rotates across verified free-tier Gemini models (2.5-flash, 2.0-flash, 2.0-flash-lite).
 * If free-tier rate limits (RPM/TPM 429) are encountered, parses Google's suggested
 * retry delay (e.g. 15s–40s), sleeps, and automatically retries.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { BASE_HUMANIZER_PROMPT } = require('../../config/prompt');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Extract suggested retry delay in ms from Google Generative AI 429 error messages.
 */
function extractRetryDelayMs(error) {
  if (!error || !error.message) return 15000;
  const match = error.message.match(/Please retry in ([\d.]+)\s*s/i);
  if (match && match[1]) {
    const seconds = parseFloat(match[1]);
    return Math.min(Math.max(Math.ceil(seconds * 1000) + 1000, 5000), 45000);
  }
  return 15000;
}

/**
 * Generate text using Google Gemini API with automatic rate-limit backoff recovery.
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
      lastError = error;
      const status = error.status || error.httpStatusCode;
      const is429 = status === 429 || error.message?.includes('429') || error.message?.includes('Quota');

      if (is429) {
        hitRateLimit = true;
        console.warn(`⚠ ${modelName} rate limited (429)`);
      } else {
        console.warn(`⚠ ${modelName} error (${status || error.message.slice(0, 60)})`);
      }
    }
  }

  // If rate limits were hit, extract Google's suggested retry delay and wait
  if (hitRateLimit && attemptNumber <= 3) {
    const delayMs = extractRetryDelayMs(lastError);
    const delaySec = Math.round(delayMs / 1000);
    console.warn(`⏳ Gemini rate limit reached. Auto-pausing ${delaySec}s for quota window reset (attempt ${attemptNumber}/3)...`);
    await sleep(delayMs);
    return generateText(prompt, options, attemptNumber + 1);
  }

  throw lastError;
}

module.exports = { generateText };
