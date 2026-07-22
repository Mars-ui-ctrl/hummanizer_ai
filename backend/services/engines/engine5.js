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

const JUDGE_PROMPT = `You are an expert writing quality judge. You will be given the ORIGINAL text and THREE rewritten versions.

Evaluate each version on these criteria (1-10 scale):
1. Writing Quality - Grammar, sentence structure, word choice
2. Readability - How easy and pleasant the text is to read
3. Consistency - Uniform tone, style, and terminology
4. Meaning Preservation - How well the original meaning is preserved
5. Fact Preservation - Whether ALL facts, names, numbers, dates are preserved

Select the BEST version based on the highest overall quality.

RESPOND WITH ONLY:
- The word "VERSION" followed by the number (1, 2, or 3)
- Then a blank line
- Then the complete text of that version

Example response format:
VERSION 2

[complete text of version 2 here]`;

/**
 * Engine 5: Multi-Candidate Selection
 * Generates 3 rewritten versions with varying temperatures,
 * then uses AI to evaluate and select the best one.
 */
async function rewrite(text) {
  // Generate 3 versions with different temperature settings
  const [version1, version2, version3] = await Promise.all([
    generateText(
      `${REWRITE_PROMPT}\n\nRewrite the following text with a focus on clarity and precision:\n\n---\n${text}\n---`,
      { temperature: 0.5 }
    ),
    generateText(
      `${REWRITE_PROMPT}\n\nRewrite the following text with a focus on natural flow and readability:\n\n---\n${text}\n---`,
      { temperature: 0.7 }
    ),
    generateText(
      `${REWRITE_PROMPT}\n\nRewrite the following text with a focus on professional polish and elegance:\n\n---\n${text}\n---`,
      { temperature: 0.8 }
    ),
  ]);

  // Use AI to judge and select the best version
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

  const judgement = await generateText(judgePrompt, { temperature: 0.3 });

  // Extract the selected version text from the judgement
  const versionMatch = judgement.match(/VERSION\s+(\d)/i);
  if (versionMatch) {
    const selectedNum = parseInt(versionMatch[1]);
    const versions = [version1, version2, version3];
    // Try to extract just the text after "VERSION N\n\n"
    const textAfterHeader = judgement.replace(/VERSION\s+\d\s*/i, '').trim();
    if (textAfterHeader.length > 50) {
      return textAfterHeader;
    }
    // Fallback to the version directly
    return versions[selectedNum - 1] || version1;
  }

  // If parsing fails, return the first version
  return version1;
}

module.exports = { rewrite };
