/**
 * Xiaomi MIMO API Provider (COMMENTED OUT as requested)
 *
 * Commented out in favor of the Z.AI GLM AI Provider (glm.js).
 * To reactivate MIMO, uncomment this file and update services/ai/index.js.
 */

/*
const MIMO_API_KEY = process.env.MIMO || process.env.MIMO_API_KEY;
const MIMO_BASE_URL = (process.env.MIMO_BASE_URL || 'https://api.xiaomimimo.com/v1').replace(/\/+$/, '');
const MIMO_MODEL = process.env.MIMO_MODEL || 'mimo-v2.5';

async function generateText(prompt, options = {}) {
  // ... MIMO implementation commented out ...
}
*/

async function generateText() {
  throw new Error('MIMO API is disabled. Z.AI GLM API provider (glm.js) is active.');
}

module.exports = { generateText };
