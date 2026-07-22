/**
 * AI Provider Index
 *
 * This file re-exports the active AI provider.
 * To switch providers, change the require path below.
 *
 * Example:
 *   const { generateText } = require('./openai');
 *   const { generateText } = require('./claude');
 */
const { generateText } = require('./gemini');

module.exports = { generateText };
