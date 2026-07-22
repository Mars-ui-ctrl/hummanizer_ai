const { generateText } = require('../ai');

const SYSTEM_PROMPT = `You are an expert writing editor. Your task is to rewrite the provided text to improve it.

RULES:
- Improve readability, grammar, sentence flow, and clarity.
- Remove awkward or repetitive phrasing.
- Preserve the original meaning completely.
- Preserve ALL facts, names, numbers, dates, and technical information exactly.
- Never invent or add new information.
- Never change the intent of the original text.
- Return ONLY the rewritten text. No explanations, no notes, no commentary.`;

/**
 * Engine 1: Single-Pass Rewrite
 * A focused single-pass rewrite for clarity, grammar, and readability.
 */
async function rewrite(text) {
  const prompt = `${SYSTEM_PROMPT}

Rewrite the following text in a single pass, focusing on clarity, grammar, and readability:

---
${text}
---`;

  return await generateText(prompt);
}

module.exports = { rewrite };
