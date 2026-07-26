/**
 * Z.AI GLM AI Provider (COMMENTED OUT as requested)
 *
 * Commented out in favor of the DeepSeek AI Provider (deepseek.js).
 * To reactivate GLM, uncomment this file and update services/ai/index.js.
 */

/*
const GLM_API_KEY = process.env.GLM || process.env.GLM_API_KEY;
const GLM_BASE_URL = (process.env.GLM_BASE_URL || 'https://api.z.ai/api/paas/v4').replace(/\/+$/, '');
const GLM_MODEL = process.env.GLM_MODEL || 'glm-5.2';

async function generateText(prompt, options = {}) {
  // ... GLM implementation commented out ...
}
*/

async function generateText() {
  throw new Error('GLM API is disabled. DeepSeek API provider (deepseek.js) is active.');
}

module.exports = { generateText };
