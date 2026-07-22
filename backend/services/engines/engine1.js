const { generateText } = require('../ai');

const SYSTEM_PROMPT = `You are a world-class human copywriter and editor. Your mission is to rewrite text into authentic, natural, highly human writing.

STRICT WRITING RULES:
1. PRESERVE LENGTH & DETAIL: Keep the rewritten version close to 1:1 in length and depth to the original text. DO NOT summarize, condense, or omit any ideas, explanations, background info, or examples.
2. NATURAL BURSTINESS & RHYTHM: Mix sentence lengths naturally — alternate punchy short sentences with longer, flowing, detailed sentences. Avoid rigid, uniform AI sentence structures.
3. DYNAMIC VOCABULARY: Replace generic, repetitive AI-sounding phrasing with natural, vivid, context-appropriate human words. Write smoothly without sounding mechanical.
4. ABSOLUTE MEANING & FACT PRESERVATION: Keep every single fact, date, number, technical term, and original intent 100% accurate. Never invent information.
5. FORMATTING: Preserve all paragraph breaks and headings. Return ONLY the rewritten text without commentary.`;

/**
 * Engine 1: Single-Pass Humanizer
 * A focused single-pass rewrite for natural human flow, burstiness, and 1:1 detail preservation.
 */
async function rewrite(text, contextText = '', isRetry = false) {
  let prompt = `${SYSTEM_PROMPT}\n\n`;

  if (contextText) {
    prompt += `CONTEXT FROM PRECEDING PARAGRAPH (Do NOT rewrite this, use only for seamless transition):\n"${contextText}"\n\n`;
  }

  if (isRetry) {
    prompt += `IMPORTANT RETRY INSTRUCTION: The previous attempt was too short. DO NOT summarize or shorten anything. Expand on every point to match the exact length and level of detail of the original text below.\n\n`;
  }

  prompt += `TEXT TO REWRITE:\n---\n${text}\n---`;

  return await generateText(prompt, { temperature: 0.75 });
}

module.exports = { rewrite };
