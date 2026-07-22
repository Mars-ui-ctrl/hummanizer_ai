const { generateText } = require('../ai');

const SYSTEM_PROMPT = `You are an expert writing editor. Your task is to rewrite the provided text to improve it.

The text has already been pre-processed to clean up formatting issues. Now focus on:
- Improving readability, grammar, sentence flow, and clarity.
- Improving overall writing quality.
- Ensuring consistent and professional tone.

RULES:
- Preserve the original meaning completely.
- Preserve ALL facts, names, numbers, dates, and technical information exactly.
- Never invent or add new information.
- Never change the intent of the original text.
- Return ONLY the rewritten text. No explanations, no notes, no commentary.`;

/**
 * Pre-process text before sending to AI:
 * - Normalize unicode punctuation to ASCII equivalents
 * - Collapse multiple spaces/newlines
 * - Remove repeated phrases
 * - Fix common formatting issues
 */
function preProcess(text) {
  let cleaned = text;

  // Normalize unicode quotes and dashes
  cleaned = cleaned
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ');

  // Collapse multiple spaces into one
  cleaned = cleaned.replace(/[ \t]+/g, ' ');

  // Collapse 3+ newlines into 2
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Remove repeated consecutive sentences
  const sentences = cleaned.split(/(?<=[.!?])\s+/);
  const deduplicated = [];
  const seen = new Set();

  for (const sentence of sentences) {
    const normalized = sentence.trim().toLowerCase();
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      deduplicated.push(sentence.trim());
    }
  }

  cleaned = deduplicated.join(' ');

  // Fix double punctuation
  cleaned = cleaned.replace(/([.!?]){2,}/g, '$1');

  // Fix spacing around punctuation
  cleaned = cleaned.replace(/\s+([.,;:!?])/g, '$1');
  cleaned = cleaned.replace(/([.,;:!?])(?=[A-Za-z])/g, '$1 ');

  // Trim lines
  cleaned = cleaned
    .split('\n')
    .map((line) => line.trim())
    .join('\n');

  return cleaned.trim();
}

/**
 * Engine 4: Pre-Process + Rewrite
 * Cleans formatting, normalizes punctuation, removes repeated phrases,
 * then sends the cleaned text to AI for rewriting.
 */
async function rewrite(text) {
  const cleanedText = preProcess(text);

  const prompt = `${SYSTEM_PROMPT}

Rewrite the following pre-cleaned text:

---
${cleanedText}
---`;

  return await generateText(prompt);
}

module.exports = { rewrite };
