/**
 * Stage 2 — AI Pass 1: Structural Destructor
 *
 * Reconstructs original AI sentence trees from scratch.
 * Strictly forbids sentence-by-sentence paraphrasing.
 * Alters syntactic structures while locking facts, statistics, dates, and names.
 *
 * API Settings: temperature: 0.85, topP: 0.90
 */

const AIProvider = require('../AIProvider');
const Logger = require('../Logger');

function getWordCount(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

const STRUCTURAL_DESTRUCTOR_SYSTEM_INSTRUCTION = `You are an expert academic writer. Your task is to completely reconstruct the following text to ensure it reads naturally and does not trigger AI detection. 

CRITICAL RULES:
1. DO NOT paraphrase sentence-by-sentence. Read the paragraph, understand the meaning, and rewrite it entirely from scratch.
2. You MUST alter the syntactic structure. Change Active Voice to Passive Voice (and vice versa). Merge short sentences into compound sentences. Split long sentences into two.
3. Vary your sentence openers. Do not start consecutive sentences with the same part of speech.
4. FACT LOCK: You must preserve 100% of facts, statistics, dates, names, and citations exactly as they appear in the original.
5. Do not add conversational filler or spam words like "delve", "tapestry", or "foster".
6. Output ONLY the reconstructed text.`;

const pass1Destructor = {
  name: 'pass1Destructor',

  async execute(ctx) {
    const chunks = ctx.chunks || [];
    if (chunks.length === 0) {
      Logger.warn(this.name, 'No chunks to reconstruct');
      return;
    }

    const reconstructedChunks = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const origWordCount = chunk.originalWordCount || getWordCount(chunk.text);

      Logger.chunkProgress(this.name, i, chunks.length, { words: origWordCount });

      const promptParts = [];
      if (chunk.context) {
        promptParts.push(`PRECEDING SENTENCE FOR CONTEXT (Do not rewrite): "${chunk.context}"\n`);
      }
      promptParts.push(`SOURCE TEXT TO RECONSTRUCT (${origWordCount} words):\n---\n${chunk.text}\n---`);

      try {
        const resultText = await AIProvider.generate(promptParts.join('\n'), {
          temperature: 0.85,
          topP: 0.90,
          systemInstruction: STRUCTURAL_DESTRUCTOR_SYSTEM_INSTRUCTION,
        });

        const newWordCount = getWordCount(resultText);

        // Guard: if output is empty or shrunk drastically (<65%), keep original
        if (origWordCount > 50 && newWordCount < origWordCount * 0.65) {
          Logger.warn(this.name, `Pass 1 shrunk chunk ${i + 1} (${origWordCount} -> ${newWordCount}), keeping original`);
          reconstructedChunks.push(chunk.text);
        } else {
          reconstructedChunks.push(resultText.trim());
        }
      } catch (err) {
        Logger.warn(this.name, `Pass 1 failed for chunk ${i + 1}: ${err.message}, keeping original`);
        reconstructedChunks.push(chunk.text);
      }
    }

    ctx.rewrittenChunks = reconstructedChunks;
    Logger.info(this.name, `Pass 1 Structural destruction complete (${reconstructedChunks.length} chunks)`);
  },
};

module.exports = pass1Destructor;
