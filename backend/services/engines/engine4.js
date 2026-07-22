const { generateText } = require('../ai');

const SYSTEM_PROMPT = `You are an expert editor specializing in structural cleanup and human tone refinement.

Your task is to take pre-processed, clean text and rewrite it with:
- Natural sentence length variation (short, medium, long).
- Rich, dynamic vocabulary tailored to the subject.
- Full preservation of original length, scope, and technical details.
- Zero summarization.

RULES:
- Preserve all facts, names, numbers, dates, and technical details 100%.
- Return ONLY the rewritten text.`;

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

  // Fix double punctuation
  cleaned = cleaned.replace(/([.!?]){2,}/g, '$1');

  // Fix spacing around punctuation
  cleaned = cleaned.replace(/\s+([.,;:!?])/g, '$1');
  cleaned = cleaned.replace(/([.,;:!?])(?=[A-Za-z])/g, '$1 ');

  return cleaned.trim();
}

/**
 * Engine 4: Clean Structure & Polish
 * Cleans formatting anomalies first, then performs a high-burstiness human rewrite.
 */
async function rewrite(text, contextText = '', isRetry = false) {
  const cleanedText = preProcess(text);

  let prompt = `${SYSTEM_PROMPT}\n\n`;

  if (contextText) {
    prompt += `PRECEDING CONTEXT:\n"${contextText}"\n\n`;
  }

  if (isRetry) {
    prompt += `STRICT RETRY: Preserve the exact length and detail of the input. Do not condense.\n\n`;
  }

  prompt += `TEXT TO REWRITE:\n---\n${cleanedText}\n---`;

  return await generateText(prompt, { temperature: 0.7 });
}

module.exports = { rewrite };
