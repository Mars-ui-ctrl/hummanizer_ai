/**
 * DeepSeek AI Provider
 *
 * Base URL: https://api.deepseek.com
 * Models: deepseek-v4-flash (default), deepseek-v4-pro, deepseek-chat
 * API Key: DEEPSEEK_API or DEEPSEEK_API_KEY env variable
 */

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API || process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, '');
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';

const MODEL_CHAIN = [
  DEEPSEEK_MODEL,
  'deepseek-v4-pro',
  'deepseek-chat',
];

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate text using DeepSeek API.
 *
 * @param {string} prompt - Full prompt to send to DeepSeek
 * @param {object} [options] - Config overrides (temperature, model, maxTokens)
 * @returns {Promise<string>} Generated text response
 */
async function generateText(prompt, options = {}) {
  const apiKey = options.apiKey || DEEPSEEK_API_KEY;

  if (!apiKey) {
    console.error('❌ DeepSeek API Key missing! Please set DEEPSEEK_API in your backend/.env file.');
    throw new Error('DeepSeek API Key is not configured in environment variables.');
  }

  const requestedModel = options.model || DEEPSEEK_MODEL;
  const models = options.model ? [options.model] : [...new Set([requestedModel, ...MODEL_CHAIN])];
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens || options.maxOutputTokens || 4096;

  const endpoint = `${DEEPSEEK_BASE_URL}/chat/completions`;

  let lastError = null;

  for (const modelName of models) {
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      attempt++;

      try {
        console.log(`🤖 DeepSeek Request (Attempt ${attempt}/${MAX_RETRIES}, model: ${modelName})...`);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature,
            max_tokens: maxTokens,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          const status = response.status;

          console.warn(`⚠️ DeepSeek API returned HTTP ${status} (Attempt ${attempt}): ${errorText.slice(0, 250)}`);

          if (status === 402 || errorText.includes('Insufficient Balance')) {
            throw new Error('DeepSeek API 402: Insufficient Balance. Please top up your DeepSeek account balance at https://platform.deepseek.com.');
          }

          if ((status === 429 || status === 503 || status === 502 || status === 500) && attempt < MAX_RETRIES) {
            const backoff = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
            console.log(`⏳ Rate limited or server busy. Retrying in ${backoff}ms...`);
            await sleep(backoff);
            continue;
          }

          throw new Error(`DeepSeek API HTTP ${status}: ${errorText || response.statusText}`);
        }

        const data = await response.json();

        if (data && data.choices && data.choices[0] && data.choices[0].message) {
          const resultText = data.choices[0].message.content || '';
          console.log(`✓ DeepSeek API success (${resultText.length} characters generated using ${modelName})`);
          return resultText.trim();
        }

        throw new Error('DeepSeek API returned invalid choice payload structure.');

      } catch (err) {
        lastError = err;
        console.error(`❌ DeepSeek API Call Error (Attempt ${attempt}, model ${modelName}): ${err.message}`);

        if (err.message.includes('Insufficient Balance')) {
          throw err;
        }

        if (attempt < MAX_RETRIES && (err.message.includes('fetch failed') || err.message.includes('ECONNRESET') || err.message.includes('ETIMEDOUT'))) {
          const backoff = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          console.log(`⏳ Network glitch. Retrying in ${backoff}ms...`);
          await sleep(backoff);
          continue;
        }

        break; // try next model in model chain if attempts exhausted
      }
    }
  }

  throw new Error(`DeepSeek API processing failed: ${lastError ? lastError.message : 'Unknown error'}`);
}

module.exports = {
  generateText,
};
