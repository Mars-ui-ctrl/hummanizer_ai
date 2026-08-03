/**
 * Google Gemini AI Provider (Multi-Key Rotation & 429 Recovery)
 *
 * Automatically rotates across available API keys from environment variables.
 * Supports comma-separated keys in GEMINI_API_KEY or GEMINI_API_KEY_1, GEMINI_API_KEY_2...
 * If Key 1 hits a 429 rate limit, it switches to Key 2 INSTANTLY.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { BASE_HUMANIZER_PROMPT } = require('../../config/prompt');

function getApiKeyPool() {
  const keys = [];

  // Comma-separated list in GEMINI_API_KEY
  if (process.env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY.split(',').forEach(k => {
      const trimmed = k.trim();
      if (trimmed && !keys.includes(trimmed)) keys.push(trimmed);
    });
  }

  // GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.
  for (let i = 1; i <= 5; i++) {
    const k = process.env[`GEMINI_API_KEY_${i}`];
    if (k && k.trim() && !keys.includes(k.trim())) {
      keys.push(k.trim());
    }
  }

  return keys.length > 0 ? keys : [''];
}

let activeKeyIndex = 0;
const MODEL_CHAIN = ['gemini-2.5-flash', 'gemini-2.0-flash'];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let lastCallTimestamp = 0;
async function paceRequests() {
  const now = Date.now();
  const elapsed = now - lastCallTimestamp;
  if (elapsed < 1200) {
    await sleep(1200 - elapsed);
  }
  lastCallTimestamp = Date.now();
}

/**
 * Generate text using Google Gemini API with instant multi-key rotation.
 */
async function generateText(prompt, options = {}, attemptNumber = 1) {
  await paceRequests();

  const generationConfig = {
    temperature: options.temperature ?? 0.72,
    topP: options.topP ?? 0.90,
    maxOutputTokens: options.maxOutputTokens ?? 8192,
  };

  const systemInstruction = options.systemInstruction || BASE_HUMANIZER_PROMPT;
  const keys = getApiKeyPool();
  const models = options.model ? [options.model] : MODEL_CHAIN;

  let lastError = null;
  let hitRateLimit = false;

  // Try each API key in the pool
  for (let k = 0; k < keys.length; k++) {
    const keyIdx = (activeKeyIndex + k) % keys.length;
    const apiKey = keys[keyIdx];

    if (!apiKey) continue;
    const genAI = new GoogleGenerativeAI(apiKey);

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

        activeKeyIndex = keyIdx;
        console.log(`✓ Used model: ${modelName} (Key #${keyIdx + 1}/${keys.length})`);
        return result.response.text();
      } catch (error) {
        lastError = error;
        const status = error.status || error.httpStatusCode;
        const is429 = status === 429 || error.message?.includes('429') || error.message?.includes('Quota');

        if (is429) {
          hitRateLimit = true;
          console.warn(`⚠ Key #${keyIdx + 1} (${modelName}) 429 rate limited, switching key...`);
          break; // Break inner model loop to try next API KEY immediately!
        }
      }
    }
  }

  // If all keys in the pool hit 429 rate limits, pause 15 seconds for quota reset and retry
  if (hitRateLimit && attemptNumber <= 3) {
    console.warn(`⏳ All API keys rate limited (429). Auto-pausing 15s for quota reset (attempt ${attemptNumber}/3)...`);
    await sleep(15000);
    return generateText(prompt, options, attemptNumber + 1);
  }

  throw lastError;
}

module.exports = { generateText };
