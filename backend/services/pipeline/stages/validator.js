/**
 * Stage 7 — Validator
 *
 * Rule-based quality validation. NEVER calls AI for validation decisions.
 *
 * Checks:
 * 1. Word count within ±10% of original
 * 2. All headings preserved
 * 3. All numbers preserved
 * 4. All names preserved
 * 5. All dates preserved
 * 6. All technical terms preserved
 * 7. Paragraph count reasonable
 * 8. List items preserved
 * 9. Formatting consistency
 *
 * If validation fails, retries ONLY the failing chunk.
 */

const config = require('../../../config/pipeline');
const AIProvider = require('../AIProvider');
const PromptBuilder = require('../PromptBuilder');
const Logger = require('../Logger');

function getWordCount(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

function getParagraphCount(text) {
  if (!text) return 0;
  return text.split(/\n\n+/).filter(p => p.trim()).length;
}

function getListItemCount(text) {
  if (!text) return 0;
  return (text.match(/^[\-\*\•]\s|^\d+[\.\)]\s/gm) || []).length;
}

function extractNumbers(text) {
  return (text.match(/\b\d+(?:\.\d+)?%?\b/g) || []).map(n => n.trim());
}

function extractAllCaps(text) {
  return (text.match(/\b[A-Z]{2,}\b/g) || []);
}

function checkHeadingsPreserved(origText, newText) {
  const origHeadings = (origText.match(/^#{1,6}\s.+$/gm) || [])
    .map(h => h.replace(/^#{1,6}\s/, '').trim().toLowerCase());
  // Also detect uppercase headings
  const upperHeadings = origText.split('\n')
    .map(l => l.trim())
    .filter(l => l.length < 80 && l.length > 0 && l === l.toUpperCase() && /[A-Z]/.test(l))
    .map(l => l.toLowerCase());
  const all = [...origHeadings, ...upperHeadings];
  if (all.length === 0) return { pass: true, missing: [] };

  const newLower = newText.toLowerCase();
  const missing = all.filter(h => !newLower.includes(h));
  return {
    pass: missing.length / all.length <= (1 - config.validation.headingThreshold),
    missing,
  };
}

function checkNumbersPreserved(origText, newText) {
  const origNums = extractNumbers(origText);
  if (origNums.length === 0) return { pass: true, missing: [] };
  const missing = origNums.filter(n => !newText.includes(n));
  // Allow some tolerance: most numbers should be present
  return {
    pass: missing.length <= Math.ceil(origNums.length * 0.1),
    missing,
  };
}

function checkNamesPreserved(namedEntities, newText) {
  if (!namedEntities || !namedEntities.names || namedEntities.names.length === 0) return { pass: true, missing: [] };
  const newLower = newText.toLowerCase();
  const missing = namedEntities.names.filter(name => {
    const lowerName = name.toLowerCase();
    // Match full name or individual major name words
    if (newLower.includes(lowerName)) return false;
    const parts = lowerName.split(/\s+/).filter(w => w.length > 3);
    return !parts.some(p => newLower.includes(p));
  });
  // Entity variation intentionally replaces 2nd+ mentions, so allow up to 50% missing full names
  return {
    pass: missing.length <= Math.ceil(namedEntities.names.length * 0.5),
    missing,
  };
}

function checkDatesPreserved(namedEntities, newText) {
  if (!namedEntities || !namedEntities.dates || namedEntities.dates.length === 0) return { pass: true, missing: [] };
  const missing = namedEntities.dates.filter(d => !newText.includes(d));
  return {
    pass: missing.length <= Math.ceil(namedEntities.dates.length * 0.1),
    missing,
  };
}

function checkTechnicalTermsPreserved(terms, newText) {
  if (!terms || terms.length === 0) return { pass: true, missing: [] };
  const newLower = newText.toLowerCase();
  const missing = terms.filter(t => !newLower.includes(t.toLowerCase()));
  return {
    pass: missing.length / terms.length <= (1 - config.validation.technicalTermThreshold),
    missing,
  };
}

function validateChunk(origText, rewrittenText, analysis) {
  const failures = [];

  // 1. Word count ±10%
  const origWords = getWordCount(origText);
  const newWords = getWordCount(rewrittenText);
  if (origWords > 50) {
    const ratio = newWords / origWords;
    if (ratio < config.validation.minWordRatio) {
      failures.push(`Word count too low (${newWords}/${origWords}, ratio ${ratio.toFixed(2)})`);
    } else if (ratio > config.validation.maxWordRatio) {
      failures.push(`Word count too high (${newWords}/${origWords}, ratio ${ratio.toFixed(2)})`);
    }
  }

  // 2. Headings
  const headingCheck = checkHeadingsPreserved(origText, rewrittenText);
  if (!headingCheck.pass) {
    failures.push(`Missing headings: ${headingCheck.missing.slice(0, 3).join(', ')}`);
  }

  // 3. Numbers
  const numCheck = checkNumbersPreserved(origText, rewrittenText);
  if (!numCheck.pass) {
    failures.push(`Missing numbers: ${numCheck.missing.slice(0, 5).join(', ')}`);
  }

  // 4. Names
  const namedEntities = analysis ? analysis.namedEntities : null;
  const nameCheck = checkNamesPreserved(namedEntities, rewrittenText);
  if (!nameCheck.pass) {
    failures.push(`Missing names: ${nameCheck.missing.slice(0, 3).join(', ')}`);
  }

  // 5. Dates
  const dateCheck = checkDatesPreserved(namedEntities, rewrittenText);
  if (!dateCheck.pass) {
    failures.push(`Missing dates: ${dateCheck.missing.slice(0, 3).join(', ')}`);
  }

  // 6. Technical terms
  const techTerms = analysis ? analysis.technicalTerms : [];
  const techCheck = checkTechnicalTermsPreserved(techTerms, rewrittenText);
  if (!techCheck.pass) {
    failures.push(`Missing terms: ${techCheck.missing.slice(0, 5).join(', ')}`);
  }

  // 7. Paragraph count
  const origParas = getParagraphCount(origText);
  const newParas = getParagraphCount(rewrittenText);
  if (origParas >= 3 && newParas < Math.ceil(origParas * config.validation.minParagraphRatio)) {
    failures.push(`Paragraph collapse (${newParas}/${origParas})`);
  }

  // 8. List items
  const origLists = getListItemCount(origText);
  const newLists = getListItemCount(rewrittenText);
  if (origLists >= 2 && newLists < Math.ceil(origLists * 0.5)) {
    failures.push(`List items dropped (${newLists}/${origLists})`);
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
    const analysis = ctx.analysis || null;

    if (rewritten.length === 0) {
      Logger.warn(this.name, 'No chunks to validate');
      return;
    }

    const validatedChunks = [];

    for (let i = 0; i < rewritten.length; i++) {
      const origText = origChunks[i] ? origChunks[i].text : '';
      let currentRewritten = rewritten[i];
      let valResult = validateChunk(origText, currentRewritten, analysis);

      let attempts = 0;

      while (!valResult.isValid && attempts < config.validation.maxRetries) {
        attempts++;
        ctx.retries = (ctx.retries || 0) + 1;
        Logger.validationFail(this.name, i, valResult.failures);
        Logger.retry(this.name, i, attempts, 'Validation retry');

        try {
          const context = origChunks[i] ? origChunks[i].context : '';
          const retryPrompt = PromptBuilder.rewrite(origText, {
            context,
            analysis,
            isRetry: true,
          });

          const retriedText = await AIProvider.generate(retryPrompt, {
            temperature: config.temperatures.rewrite,
          });

          currentRewritten = retriedText.trim();
          valResult = validateChunk(origText, currentRewritten, analysis);
        } catch (err) {
          Logger.warn(this.name, `Retry error chunk ${i + 1}: ${err.message}`);
          break;
        }
      }

      if (valResult.isValid) {
        Logger.info(this.name, `Chunk ${i + 1} passed`);
      } else {
        Logger.warn(this.name, `Chunk ${i + 1} accepted with warnings: ${valResult.failures.join('; ')}`);
      }

      validatedChunks.push(currentRewritten);
    }

    ctx.rewrittenChunks = validatedChunks;
  },
};

module.exports = validator;
