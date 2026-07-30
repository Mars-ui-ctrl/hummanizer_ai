/**
 * Google Gemini AI Provider (with Multi-Key Rotation, Dynamic 429 Recovery, & Request Pacing)
 *
 * Key Features:
 * 1. Multi-API-Key Pool: Rotates keys automatically if GEMINI_API_KEY contains comma-separated keys
 *    or if extra keys (GEMINI_API_KEY_1, GEMINI_API_KEY_2) are defined.
 * 2. Multi-Model Fallback: Rotates across gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-flash.
 * 3. Inter-Call Pacing: Enforces a 1.5s minimum gap between consecutive AI requests to prevent bursting past 15 RPM.
 * 4. Dynamic Backoff: If all keys/models hit 429, parses Google's retry delay and sleeps before retrying.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { BASE_HUMANIZER_PROMPT } = require('../../config/prompt');

// ─── Build API Key Pool ────────────────────────────────────────────

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
const MODEL_CHAIN = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Inter-request rate limiter (prevents >15 RPM bursts)
let lastCallTimestamp = 0;
async function paceRequests() {
  const now = Date.now();
  const elapsed = now - lastCallTimestamp;
  if (elapsed < 1500) {
    await sleep(1500 - elapsed);
  }
  lastCallTimestamp = Date.now();
}

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
 * Generate text using Google Gemini API with key rotation and backoff.
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

        // Set successful key as current primary
        activeKeyIndex = keyIdx;
        console.log(`✓ Used model: ${modelName} (key #${keyIdx + 1}/${keys.length}, temp: ${generationConfig.temperature})`);
        return result.response.text();
      } catch (error) {
        lastError = error;
        const status = error.status || error.httpStatusCode;
        const is429 = status === 429 || error.message?.includes('429') || error.message?.includes('Quota');

        if (is429) {
          hitRateLimit = true;
          console.warn(`⚠ Key #${keyIdx + 1} / ${modelName} rate limited (429)`);
        } else {
          console.warn(`⚠ Key #${keyIdx + 1} / ${modelName} error (${status || error.message.slice(0, 60)})`);
        }
      }
    }

    // If this key hit 429, try next key in pool
    if (keys.length > 1) {
      console.warn(`↻ Key #${keyIdx + 1} rate limited. Rotating to key #${((keyIdx + 1) % keys.length) + 1}...`);
    }
  }

  // If all keys and models hit rate limits, wait for quota reset and retry
  if (hitRateLimit && attemptNumber <= 3) {
    const delayMs = extractRetryDelayMs(lastError);
    const delaySec = Math.round(delayMs / 1000);
    console.warn(`⏳ All API keys rate limited. Auto-pausing ${delaySec}s for quota window reset (attempt ${attemptNumber}/3)...`);
    await sleep(delayMs);
    return generateText(prompt, options, attemptNumber + 1);
  }

  throw lastError;
}

module.exports = { generateText };
