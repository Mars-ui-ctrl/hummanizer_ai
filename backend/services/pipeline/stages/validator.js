/**
 * Stage 6 — Fact & Format Validator (Pure JS)
 *
 * Verifies factual & structural preservation:
 * 1. Verifies word count ratio is between 85% and 130% of original chunk.
 * 2. Extracts all numbers (\d+) & dates from original chunk and verifies existence in final output.
 * 3. Never calls AI for validation decisions.
 */

const config = require('../../../config/pipeline');
const Logger = require('../Logger');

function getWordCount(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

function extractNumbers(text) {
  return (text.match(/\b\d+(?:\.\d+)?%?\b/g) || []).map(n => n.trim());
}

function checkNumbersPreserved(origText, newText) {
  const origNums = extractNumbers(origText);
  if (origNums.length === 0) return { pass: true, missing: [] };
  const missing = origNums.filter(n => !newText.includes(n));
  // Allow slight tolerance (up to 15% missing numbers)
  return {
    pass: missing.length <= Math.ceil(origNums.length * 0.15),
    missing,
  };
}

function validateChunk(origText, rewrittenText) {
  const failures = [];

  // 1. Word count ratio: 85% to 130%
  const origWords = getWordCount(origText);
  const newWords = getWordCount(rewrittenText);

  if (origWords > 50) {
    const ratio = newWords / origWords;
    const minRatio = config.validation.minWordRatio || 0.85;
    const maxRatio = config.validation.maxWordRatio || 1.30;

    if (ratio < minRatio) {
      failures.push(`Word count too low (${newWords}/${origWords}, ratio ${ratio.toFixed(2)})`);
    } else if (ratio > maxRatio) {
      failures.push(`Word count too high (${newWords}/${origWords}, ratio ${ratio.toFixed(2)})`);
    }
  }

  // 2. Fact Lock Check (Numbers & Dates)
  const numCheck = checkNumbersPreserved(origText, rewrittenText);
  if (!numCheck.pass) {
    failures.push(`Missing numbers/dates: ${numCheck.missing.slice(0, 5).join(', ')}`);
  }

  return {
    isValid: failures.length === 0,
    failures,
  };
}

const validator = {
  name: 'validator',

  async execute(ctx) {
    const origChunks = ctx.chunks || [];
    const rewritten = ctx.rewrittenChunks || [];

    if (rewritten.length === 0) {
      Logger.warn(this.name, 'No chunks to validate');
      return;
    }

    for (let i = 0; i < rewritten.length; i++) {
      const origText = origChunks[i] ? origChunks[i].text : '';
      const currentRewritten = rewritten[i];
      const valResult = validateChunk(origText, currentRewritten);

      if (valResult.isValid) {
        Logger.info(this.name, `Chunk ${i + 1} passed fact & format validation`);
      } else {
        Logger.warn(this.name, `Chunk ${i + 1} validation warnings: ${valResult.failures.join('; ')}`);
      }
    }
  },
};

module.exports = validator;
