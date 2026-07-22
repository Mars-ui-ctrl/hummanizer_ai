const { generateText } = require('../ai');

const PASS1_PROMPT = `You are an expert human copywriter. Your task is to rewrite text to give it natural human voice, varied sentence lengths, and excellent flow.

RULES:
- Preserve original length, detail, and explanations completely. Do NOT summarize or shorten.
- Vary sentence length and structure (mix short punchy statements with longer descriptive sentences).
- Preserve all facts, names, dates, numbers, and technical terms exactly.
- Return ONLY the rewritten text.`;

const PASS2_PROMPT = `You are a chief publication editor. Perform a SECOND REVIEW PASS on the rewritten text below.

REVIEW FOCUS:
- Ensure smooth transitions and natural sentence rhythms.
- Eliminate awkward phrasing, mechanical repetition, or remaining rigid patterns.
- Ensure sentence lengths vary dynamically.
- CRITICAL: Maintain full original document length and depth. Do NOT condense paragraphs.
- Return ONLY the finalized text.`;

/**
 * Engine 2: Two-Pass Rewrite & Audit
 * Pass 1 humanizes tone and sentence rhythm; Pass 2 audits flow, consistency, and detail preservation.
 */
async function rewrite(text, contextText = '', isRetry = false) {
  let prompt1 = `${PASS1_PROMPT}\n\n`;
  if (contextText) {
    prompt1 += `PRECEDING CONTEXT (for transition flow only):\n"${contextText}"\n\n`;
  }
  if (isRetry) {
    prompt1 += `RETRY WARNING: Do NOT condense or summarize. Match the full length and detail of the input.\n\n`;
  }
  prompt1 += `TEXT TO REWRITE:\n---\n${text}\n---`;

  const firstPass = await generateText(prompt1, { temperature: 0.7 });

  let prompt2 = `${PASS2_PROMPT}\n\nREWRITTEN TEXT TO REVIEW AND POLISH:\n---\n${firstPass}\n---`;
  const secondPass = await generateText(prompt2, { temperature: 0.6 });

  return secondPass;
}

module.exports = { rewrite };
