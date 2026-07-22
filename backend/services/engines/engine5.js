const { generateText } = require('../ai');

const REWRITE_PROMPT = `You are a master human writer. Your task is to rewrite the text to sound completely natural, engaging, and human.

CRITICAL RULES:
- Preserve original length, detail, and explanations completely. Do NOT summarize or condense.
- Use natural sentence length variation (burstiness).
- Preserve all facts, names, dates, numbers, and technical terms.
- Return ONLY the rewritten text.`;

const JUDGE_PROMPT = `You are a senior publishing judge. Evaluate THREE rewritten versions of a text.

CRITERIA:
1. Detail Preservation (Highest weight): Does it maintain the full length and detail of the original without summarizing?
2. Natural Human Tone: Does it vary sentence lengths naturally and sound like a human writer?
3. Flow & Clarity: Are paragraph transitions smooth and clear?

Select the BEST version.

RESPOND WITH ONLY:
VERSION 1, VERSION 2, or VERSION 3
Followed by a blank line, then the complete text of that version.`;

/**
 * Engine 5: Multi-Candidate Best-of-3 Engine
 * Generates 3 candidates with varied prompts/temperatures, then uses AI to judge the best version based on detail preservation and natural tone.
 */
async function rewrite(text, contextText = '', isRetry = false) {
  let basePrompt = `${REWRITE_PROMPT}\n\n`;
  if (contextText) {
    basePrompt += `PRECEDING CONTEXT:\n"${contextText}"\n\n`;
  }
  if (isRetry) {
    basePrompt += `RETRY NOTICE: Write in full length and detail. Do not shorten.\n\n`;
  }

  // Generate 3 versions in parallel with different stylistic focuses
  const [version1, version2, version3] = await Promise.all([
    generateText(
      `${basePrompt}Focus on conversational clarity and dynamic sentence rhythms:\n\n---\n${text}\n---`,
      { temperature: 0.7 }
    ),
    generateText(
      `${basePrompt}Focus on elegant vocabulary and natural human flow:\n\n---\n${text}\n---`,
      { temperature: 0.75 }
    ),
    generateText(
      `${basePrompt}Focus on high sentence length variance (mix punchy short sentences with flowing longer sentences):\n\n---\n${text}\n---`,
      { temperature: 0.8 }
    ),
  ]);

  const judgePrompt = `${JUDGE_PROMPT}

ORIGINAL TEXT:
---
${text}
---

VERSION 1:
---
${version1}
---

VERSION 2:
---
${version2}
---

VERSION 3:
---
${version3}
---`;

  try {
    const judgement = await generateText(judgePrompt, { temperature: 0.3 });
    const versionMatch = judgement.match(/VERSION\s+([123])/i);
    if (versionMatch) {
      const selectedNum = parseInt(versionMatch[1]);
      const versions = [version1, version2, version3];
      const textAfterHeader = judgement.replace(/VERSION\s+[123]\s*/i, '').trim();
      if (textAfterHeader.length > 50) {
        return textAfterHeader;
      }
      return versions[selectedNum - 1] || version2;
    }
  } catch (err) {
    console.warn(`⚠️ Engine 5 judge error, defaulting to Candidate 2: ${err.message}`);
  }

  return version2;
}

module.exports = { rewrite };
