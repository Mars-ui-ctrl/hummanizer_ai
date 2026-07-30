/**
 * Stage — Sentence Structure Randomization (Post-Rewrite NLP)
 *
 * Pure JavaScript sentence-level transformations. Zero AI calls.
 *
 * Operations:
 * 1. Merge consecutive short sentences (<8 words) using natural conjunctions
 * 2. Split excessively long sentences (>35 words) at clause boundaries
 * 3. Insert natural contractions (do not → don't, etc.) with ~50% probability
 * 4. Vary sentence openers to break repetitive "The X..." patterns
 *
 * This stage operates on ctx.rewrittenChunks[] AFTER entity variation.
 * It introduces syntactic randomness that AI detectors flag as "human burstiness."
 */

const Logger = require('../Logger');

// ─── Contraction Map ───────────────────────────────────────────────

const CONTRACTION_MAP = {
  'do not': "don't",
  'does not': "doesn't",
  'did not': "didn't",
  'is not': "isn't",
  'are not': "aren't",
  'was not': "wasn't",
  'were not': "weren't",
  'have not': "haven't",
  'has not': "hasn't",
  'had not': "hadn't",
  'will not': "won't",
  'would not': "wouldn't",
  'could not': "couldn't",
  'should not': "shouldn't",
  'cannot': "can't",
  'can not': "can't",
  'it is': "it's",
  'that is': "that's",
  'there is': "there's",
  'they are': "they're",
  'they have': "they've",
  'we are': "we're",
  'we have': "we've",
  'you are': "you're",
  'you have': "you've",
  'I am': "I'm",
  'I have': "I've",
  'I will': "I'll",
  'I would': "I'd",
  'he is': "he's",
  'she is': "she's",
  'who is': "who's",
  'what is': "what's",
  'let us': "let's",
};

// ─── Merge Conjunctions ────────────────────────────────────────────

const MERGE_CONJUNCTIONS = [
  ', and ',
  ', plus ',
  ' — ',
  '; ',
  ', while ',
  ', and at the same time ',
];

// ─── Sentence Opener Alternatives ──────────────────────────────────

const OPENER_ALTERNATIVES = {
  'the': ['This', 'A', 'One notable', 'Each'],
  'it': ['This', 'That', 'The situation', 'What happened'],
  'there': ['Several', 'A number of', 'Various', 'Quite a few'],
  'this': ['The', 'Such a', 'That particular', 'One such'],
  'these': ['Such', 'Those', 'Several of the', 'Many of the'],
  'however': ['Still', 'That said', 'On the other hand', 'Even so'],
  'furthermore': ['Plus', 'On top of that', 'What\'s more', 'Also'],
  'moreover': ['Besides that', 'Adding to this', 'Not only that', 'Along with this'],
  'additionally': ['On top of that', 'Plus', 'Also worth noting', 'Beyond that'],
  'consequently': ['As a result', 'Because of this', 'So', 'That meant'],
  'therefore': ['So', 'For that reason', 'That\'s why', 'Which meant'],
  'nevertheless': ['Still', 'Even so', 'But', 'And yet'],
  'in conclusion': ['All things considered', 'Looking at the big picture', 'Taking everything into account'],
};

// ─── Helpers ───────────────────────────────────────────────────────

function countWords(str) {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isProtectedLine(line) {
  const t = line.trim();
  return (
    t.startsWith('```') ||
    /^#{1,6}\s/.test(t) ||
    /^[-*•]\s/.test(t) ||
    /^\d+[.)]\s/.test(t) ||
    /^>\s/.test(t) ||
    /^\s{4}/.test(line)
  );
}

// ─── Core Transformations ──────────────────────────────────────────

/**
 * Merge consecutive short sentences into compound sentences.
 */
function mergeShortSentences(sentences) {
  const result = [];
  let i = 0;

  while (i < sentences.length) {
    const current = sentences[i].trim();
    const currentWords = countWords(current);

    // If current sentence is short and next one exists and is also short
    if (currentWords <= 8 && i + 1 < sentences.length && Math.random() < 0.45) {
      const next = sentences[i + 1].trim();
      const nextWords = countWords(next);

      if (nextWords <= 15 && currentWords + nextWords <= 28) {
        const conj = MERGE_CONJUNCTIONS[Math.floor(Math.random() * MERGE_CONJUNCTIONS.length)];
        // Remove trailing period from current, lowercase next's first char
        const merged = current.replace(/[.]\s*$/, '') + conj +
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

/**
 * Split excessively long sentences at clause boundaries.
 */
function splitLongSentences(sentences) {
  const result = [];

  for (const sentence of sentences) {
    const words = countWords(sentence);

    if (words <= 35 || Math.random() > 0.35) {
      result.push(sentence);
      continue;
    }

    // Try splitting at conjunction/clause boundaries
    const splitPoints = [
      /,\s+(and|but|yet|so|while|whereas|although|because|however|which|where)\s+/i,
      /;\s+/,
      /\s+—\s+/,
    ];

    let didSplit = false;
    for (const pattern of splitPoints) {
      const match = sentence.match(pattern);
      if (match && match.index > 15 && match.index < sentence.length - 15) {
        const partA = sentence.slice(0, match.index).trim();
        let partB = sentence.slice(match.index + match[0].length).trim();

        // Capitalize partB
        partB = partB.charAt(0).toUpperCase() + partB.slice(1);

        // Ensure partA ends with period
        const cleanA = partA.replace(/[,;]\s*$/, '') + '.';

        if (countWords(cleanA) >= 6 && countWords(partB) >= 6) {
          result.push(cleanA);
          result.push(partB);
          didSplit = true;
          break;
        }
      }
    }

    if (!didSplit) result.push(sentence);
  }

  return result;
}

/**
 * Insert natural contractions randomly (~50% of opportunities).
 */
function insertContractions(text) {
  let result = text;

  for (const [full, contracted] of Object.entries(CONTRACTION_MAP)) {
    const regex = new RegExp(`\\b${escapeRegex(full)}\\b`, 'gi');
    result = result.replace(regex, (match) => {
      if (Math.random() < 0.5) {
        // Preserve capitalization
        if (match[0] === match[0].toUpperCase() && match[0] !== match[0].toLowerCase()) {
          return contracted.charAt(0).toUpperCase() + contracted.slice(1);
        }
        return contracted;
      }
      return match;
    });
  }

  return result;
}

/**
 * Vary sentence openers to avoid repetitive "The X..." patterns.
 */
function varySentenceOpeners(sentences) {
  const recentOpeners = [];

  return sentences.map((sentence) => {
    const firstWord = (sentence.match(/^\s*(\w+)/) || [])[1] || '';
    const lower = firstWord.toLowerCase();

    const alts = OPENER_ALTERNATIVES[lower];
    if (!alts) {
      recentOpeners.push(lower);
      return sentence;
    }

    // Only replace if this opener was used recently (within last 3 sentences)
    const recentCount = recentOpeners.slice(-3).filter(o => o === lower).length;
    if (recentCount === 0) {
      recentOpeners.push(lower);
      return sentence;
    }

    // Pick a random alternative not recently used
    const unused = alts.filter(a => !recentOpeners.slice(-5).includes(a.toLowerCase().split(/\s/)[0]));
    if (unused.length === 0) {
      recentOpeners.push(lower);
      return sentence;
    }

    const alt = unused[Math.floor(Math.random() * unused.length)];
    recentOpeners.push(alt.toLowerCase().split(/\s/)[0]);

    // Replace the first word
    return alt + sentence.slice(firstWord.length);
  });
}

/**
 * Process a single text chunk through all sentence transformations.
 */
function processChunk(text) {
  const paragraphs = text.split(/\n\n+/);
  let stats = { merged: 0, split: 0, contractions: 0, openerChanges: 0 };

  const processedParagraphs = paragraphs.map(paragraph => {
    if (isProtectedLine(paragraph)) return paragraph;

    // Extract sentences
    let sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
    sentences = sentences.map(s => s.trim()).filter(s => s.length > 0);

    if (sentences.length === 0) return paragraph;

    const origCount = sentences.length;

    // 1. Merge short sentences
    sentences = mergeShortSentences(sentences);
    stats.merged += Math.max(0, origCount - sentences.length);

    // 2. Split long sentences
    const preSplitCount = sentences.length;
    sentences = splitLongSentences(sentences);
    stats.split += Math.max(0, sentences.length - preSplitCount);

    // 3. Vary sentence openers
    sentences = varySentenceOpeners(sentences);

    return sentences.join(' ');
  });

  let result = processedParagraphs.join('\n\n');

  // 4. Insert contractions across the whole chunk
  const preContractionLen = result.length;
  result = insertContractions(result);
  stats.contractions = Math.abs(preContractionLen - result.length);

  return { text: result, stats };
}

// ─── Pipeline Stage ────────────────────────────────────────────────

const sentenceRestructurer = {
  name: 'sentenceRestructurer',

  async execute(ctx) {
    const chunks = ctx.rewrittenChunks || [];
    if (chunks.length === 0) {
      Logger.warn(this.name, 'No chunks to restructure');
      return;
    }

    let totalStats = { merged: 0, split: 0, contractions: 0 };

    const processedChunks = chunks.map((chunk, i) => {
      const { text, stats } = processChunk(chunk);
      totalStats.merged += stats.merged;
      totalStats.split += stats.split;
      totalStats.contractions += stats.contractions;
      return text;
    });

    ctx.rewrittenChunks = processedChunks;

    Logger.info(this.name, `Sentence restructuring complete`, {
      merged: totalStats.merged,
      split: totalStats.split,
      contractionDelta: totalStats.contractions,
    });
  },
};

module.exports = sentenceRestructurer;
