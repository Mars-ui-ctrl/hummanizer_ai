const { generateText } = require('../ai');

const SYSTEM_PROMPT = `You are a specialist in document-level narrative flow and structural coherence.

Your task is to rewrite the provided text while using preceding document context to build seamless, natural paragraph transitions and maintain an engaging human voice.

RULES:
1. FULL DETAIL & LENGTH: Preserve 100% of the original depth, explanations, and length. Never summarize.
2. CONTEXTUAL TRANSITIONS: Use the preceding text context to create smooth, natural connections between sections.
3. BURSTINESS: Vary sentence structures and lengths to reflect authentic human writing styles.
4. FACT RETENTION: Keep all numbers, dates, names, facts, and core meaning intact.
5. Return ONLY the rewritten section.`;

/**
 * Engine 3: Context-Aware Coherence Engine
 * Emphasizes paragraph-to-paragraph transition quality and narrative continuity using preceding context.
 */
async function rewrite(text, contextText = '', isRetry = false) {
  let prompt = `${SYSTEM_PROMPT}\n\n`;

  if (contextText) {
    prompt += `PRECEDING SECTION CONTEXT (use to make seamless transition into this new section):\n"${contextText}"\n\n`;
  }

  if (isRetry) {
    prompt += `RETRY REQUIREMENT: Write in full detail. Match or exceed the original word count.\n\n`;
  }

  prompt += `TEXT TO REWRITE:\n---\n${text}\n---`;

  return await generateText(prompt, { temperature: 0.65 });
}

module.exports = { rewrite };
