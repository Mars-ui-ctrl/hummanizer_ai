const { generateText } = require('../ai');

const REWRITE_PROMPT = `You are an expert writing editor. Your task is to rewrite the provided text to improve it.

RULES:
- Improve readability, grammar, sentence flow, and clarity.
- Remove awkward or repetitive phrasing.
- Preserve the original meaning completely.
- Preserve ALL facts, names, numbers, dates, and technical information exactly.
- Never invent or add new information.
- Never change the intent of the original text.
- Return ONLY the rewritten text. No explanations, no notes, no commentary.`;

const REVIEW_PROMPT = `You are an expert writing reviewer and editor. You have been given a rewritten version of a text.

Your task is to perform a SECOND REVIEW PASS on this rewritten text.

FOCUS ON:
- Improving consistency in tone and style throughout the text.
- Fixing any remaining grammar issues.
- Improving sentence flow and transitions.
- Smoothing out any awkward phrasing that was missed.

RULES:
- Preserve the original meaning completely.
- Preserve ALL facts, names, numbers, dates, and technical information exactly.
- Never invent or add new information.
- Return ONLY the improved text. No explanations, no notes, no commentary.`;

/**
 * Engine 2: Two-Pass Rewrite
 * First pass rewrites for quality. Second pass reviews for consistency and flow.
 */
async function rewrite(text) {
  // Pass 1: Initial rewrite
  const firstPass = await generateText(`${REWRITE_PROMPT}

Rewrite the following text:

---
${text}
---`);

  // Pass 2: Review and refine
  const secondPass = await generateText(`${REVIEW_PROMPT}

Review and improve this text:

---
${firstPass}
---`);

  return secondPass;
}

module.exports = { rewrite };
