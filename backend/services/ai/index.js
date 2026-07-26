/**
 * AI Provider Index
 *
 * Active provider: Google Gemini AI Provider (gemini.js — Model: gemini-2.5-flash)
 */

// Active Gemini AI Provider:
const { generateText } = require('./gemini');

// Commented out alternative providers:
// const { generateText } = require('./mimo');
// const { generateText } = require('./glm');
// const { generateText } = require('./deepseek');

module.exports = { generateText };
