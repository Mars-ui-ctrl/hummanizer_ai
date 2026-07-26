/**
 * Centralized Prompt Configuration
 *
 * Base humanizer prompt used across all pipeline stages and methods.
 * Supports override via environment variable `HUMANIZER_PROMPT` on Render/Vercel.
 */

const DEFAULT_HUMANIZER_PROMPT = `Rewrite the following text so it sounds like a real human wrote it — not a machine. Apply these rules:

1. SENTENCE RHYTHM: Vary sentence length dramatically. Some sentences should be 5–6 words. Others should run longer and wind a little, the way someone actually explaining something would talk. Avoid uniform sentence length at all costs.

2. NATURAL LANGUAGE: Replace stiff, corporate, or overly formal phrasing with how a person would actually say it in conversation. If a sentence sounds like it belongs in a press release, rewrite it.

3. SPECIFIC DETAILS: Swap generic statements for concrete, specific ones. Instead of "many people enjoy coffee," say something like "my coworker drinks four espressos before noon."

4. VOICE & PERSONALITY: Add small touches of personality — a brief opinion, a parenthetical aside, a relatable observation. Let the writer's perspective peek through.

5. IMPERFECTIONS: Allow minor, natural imperfections. Start a sentence with "And" or "But." Use a fragment for emphasis. End a sentence with a preposition if it sounds better.

6. AVOID AI PATTERNS: Do not use these structures:
   - "In today's world..."
   - "It's important to note that..."
   - "Delving into..." / "Diving deep..."
   - Perfect A-B-C parallel lists in every paragraph
   - Excessive hedging ("It could be argued that perhaps...")
   - Summarizing the whole text at the end like a conclusion paragraph

7. PARAGRAPH FLOW: Let ideas connect naturally, the way one thought leads to the next in someone's head — not like an essay outline with topic sentences and transitions.`;

const BASE_HUMANIZER_PROMPT = process.env.HUMANIZER_PROMPT || DEFAULT_HUMANIZER_PROMPT;

module.exports = {
  BASE_HUMANIZER_PROMPT,
};
