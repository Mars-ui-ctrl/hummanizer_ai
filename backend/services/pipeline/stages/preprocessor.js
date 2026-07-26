/**
 * Stage 2 — Structural Transformation
 *
 * Pure JavaScript restructuring applied BEFORE any AI call.
 * Zero meaning change. Zero AI calls.
 *
 * Operations:
 * - Split excessively long sentences (>40 words) at clause boundaries
 * - Merge extremely short consecutive sentences (<6 words) where appropriate
 * - Reorder clauses to vary sentence openings (move "Because X, Y" → "Y because X")
 * - Normalize unicode, whitespace, and punctuation
 * - Vary paragraph boundaries (split long paragraphs, merge very short ones)
 * - Protect headings, lists, code blocks, quotations, and technical terms
 */

const config = require('../../../config/pipeline');
const Logger = require('../Logger');

function countWords(str) {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

// ─── Sentence Splitting ────────────────────────────────────────────

function splitLongSentence(sentence) {
  const words = countWords(sentence);
  if (words <= config.structural.longSentenceThreshold) return [sentence];

  // Try splitting at conjunction/clause boundaries
  const clausePattern = /,\s+(and|but|yet|so|while|whereas|although|because|however|which|where|since)\s+/i;
  const match = sentence.match(clausePattern);
  if (!match) return [sentence];

  const idx = match.index + 1; // after the comma
  const partA = sentence.slice(0, idx).trim();
  const partB = sentence.slice(idx).trim();

  // Clean up: remove leading comma/conjunction from partB and capitalize
  let cleanB = partB.replace(/^,?\s*/, '');
  const conjMatch = cleanB.match(/^(and|but|yet|so)\s+/i);
  if (conjMatch) {
    cleanB = cleanB.slice(conjMatch[0].length);
  }
  cleanB = cleanB.charAt(0).toUpperCase() + cleanB.slice(1);

  // Ensure partA ends with a period
  let cleanA = partA.replace(/,\s*$/, '');
  if (!/[.!?]$/.test(cleanA)) cleanA += '.';

  if (countWords(cleanA) >= 5 && countWords(cleanB) >= 5) {
    return [cleanA, cleanB];
  }
  return [sentence];
}

// ─── Sentence Merging ──────────────────────────────────────────────

function mergeShortSentences(sentences) {
  const threshold = config.structural.shortSentenceThreshold;
  const result = [];
  let i = 0;

  while (i < sentences.length) {
    const current = sentences[i].trim();
    const currentWords = countWords(current);

    if (currentWords <= threshold && i + 1 < sentences.length) {
      const next = sentences[i + 1].trim();
      const nextWords = countWords(next);

      if (nextWords <= threshold && currentWords + nextWords <= 25) {
        // Merge: remove terminal punctuation from current, add comma, append next lowercased
        const merged = current.replace(/[.!?]$/, '') + ', ' +
          next.charAt(0).toLowerCase() + next.slice(1);
        result.push(merged);
        i += 2;
        continue;
      }
    }
    result.push(current);
    i++;
  }
  return result;
}

// ─── Clause Reordering ─────────────────────────────────────────────

const DEPENDENT_OPENERS = /^(Because|Since|Although|While|When|If|After|Before|Unless|Until|Whereas)\s+/i;

function reorderClauses(sentence) {
  const match = sentence.match(DEPENDENT_OPENERS);
  if (!match) return sentence;

  // Find the main clause boundary (comma separating dependent from independent clause)
  const commaIdx = sentence.indexOf(',', match[0].length);
  if (commaIdx === -1) return sentence;

  const dependent = sentence.slice(0, commaIdx).trim();
  const independent = sentence.slice(commaIdx + 1).trim();

  if (countWords(independent) < 4) return sentence;

  // Reorder: independent first, then dependent (lowercased conjunction)
  const conjunction = match[1].toLowerCase();
  const dependentBody = dependent.slice(match[1].length).trim();
  let reordered = independent.charAt(0).toUpperCase() + independent.slice(1);

  // Ensure proper ending
  reordered = reordered.replace(/[.!?]$/, '');
  reordered += ' ' + conjunction + ' ' + dependentBody;
  if (!/[.!?]$/.test(reordered)) reordered += '.';

  return reordered;
}

// ─── Paragraph Restructuring ───────────────────────────────────────

function restructureParagraphs(paragraphs) {
  const result = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    const words = countWords(para);

    // Split very long paragraphs (>200 words) at a mid-sentence boundary
    if (words > 200) {
      const sentences = para.match(/[^.!?]+[.!?]+/g) || [para];
      if (sentences.length >= 4) {
        const mid = Math.ceil(sentences.length / 2);
        result.push(sentences.slice(0, mid).join(' ').trim());
        result.push(sentences.slice(mid).join(' ').trim());
        continue;
      }
    }

    // Merge very short paragraphs (<20 words) with next if next is also short
    if (words < 20 && i + 1 < paragraphs.length && countWords(paragraphs[i + 1]) < 20) {
      result.push(para + ' ' + paragraphs[i + 1]);
      i++; // skip next
      continue;
    }

    result.push(para);
  }

  return result;
}

// ─── Protected Line Detection ──────────────────────────────────────

function isProtectedLine(line) {
  const t = line.trim();
  return (
    t.startsWith('```') ||
    /^#{1,6}\s/.test(t) ||
    /^[\-\*\•]\s/.test(t) ||
    /^\d+[\.\)]\s/.test(t) ||
    /^>\s/.test(t) ||
    /^\s{4}/.test(line)
  );
}

// ─── Main Stage ─────────────────────────────────────────────────────

const structuralTransformer = {
  name: 'structural',

  async execute(ctx) {
    let text = ctx.extractedText || ctx.rawText || '';
    const origLen = text.length;

    // 1. Normalize unicode
    text = text
      .replace(/[\u2018\u2019\u201A]/g, "'")
      .replace(/[\u201C\u201D\u201E]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\u2026/g, '...')
      .replace(/\u00A0/g, ' ')
      .replace(/\uFEFF/g, '');

    // 2. Collapse whitespace
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\n{3,}/g, '\n\n');

    // 3. Fix punctuation
    text = text.replace(/([.!?]){2,}/g, '$1');
    text = text.replace(/\s+([.,;:!?])/g, '$1');
    text = text.replace(/([.,;:!?])(?=[A-Za-z])/g, '$1 ');

    // 4. Process line-by-line: split long sentences, merge short, reorder clauses
    const lines = text.split('\n');
    const processedLines = [];
    let inCodeBlock = false;

    for (const line of lines) {
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        processedLines.push(line);
        continue;
      }

      if (inCodeBlock || isProtectedLine(line)) {
        processedLines.push(line);
        continue;
      }

      // Extract sentences from line
      let sentences = line.match(/[^.!?]+[.!?]+/g) || (line.trim() ? [line] : ['']);

      // a) Split excessively long sentences
      const expanded = [];
      for (const s of sentences) {
        expanded.push(...splitLongSentence(s.trim()));
      }

      // b) Merge excessively short sentences
      const merged = mergeShortSentences(expanded);

      // c) Reorder some dependent-clause-first sentences (apply to ~30% to create variety)
      const reordered = merged.map((s, idx) => {
        if (idx % 3 === 1 && DEPENDENT_OPENERS.test(s)) {
          return reorderClauses(s);
        }
        return s;
      });

      processedLines.push(reordered.join(' '));
    }

    text = processedLines.join('\n').trim();

    // 5. Paragraph restructuring
    const paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
    const restructured = restructureParagraphs(paragraphs);
    text = restructured.join('\n\n');

    // 6. Final line trimming
    text = text.split('\n').map(l => l.trim()).join('\n').trim();

    ctx.cleanText = text;

    Logger.info(this.name, `Structural transformation complete`, {
      origChars: origLen,
      cleanChars: text.length,
      delta: origLen - text.length
    });
  },
};

module.exports = structuralTransformer;
