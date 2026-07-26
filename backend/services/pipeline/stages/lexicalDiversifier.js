/**
 * Stage 3 — Lexical Diversification
 *
 * Pure JavaScript controlled synonym replacement system.
 * Zero AI calls.
 *
 * Rules:
 * - NEVER replace technical terms, acronyms, proper nouns, numbers, or dates.
 * - Only diversify common verbs, adjectives, connectors, and sentence starters.
 * - Maintain readability and meaning.
 * - Apply controlled replacement limits to avoid over-transformation.
 */

const config = require('../../../config/pipeline');
const Logger = require('../Logger');

// ─── Synonym Maps ───────────────────────────────────────────────────

const VERB_SYNONYMS = {
  'use': ['utilize', 'employ', 'leverage', 'apply'],
  'make': ['create', 'produce', 'construct', 'build'],
  'show': ['demonstrate', 'illustrate', 'reveal', 'indicate'],
  'get': ['obtain', 'acquire', 'receive', 'gain'],
  'give': ['provide', 'offer', 'deliver', 'supply'],
  'help': ['assist', 'support', 'facilitate', 'aid'],
  'need': ['require', 'demand', 'necessitate'],
  'keep': ['maintain', 'retain', 'preserve'],
  'start': ['begin', 'initiate', 'commence', 'launch'],
  'end': ['conclude', 'finish', 'complete', 'terminate'],
  'change': ['modify', 'alter', 'adjust', 'transform'],
  'improve': ['enhance', 'refine', 'optimize', 'strengthen'],
  'increase': ['expand', 'boost', 'amplify', 'elevate'],
  'decrease': ['reduce', 'diminish', 'lower', 'minimize'],
  'find': ['discover', 'identify', 'locate', 'uncover'],
  'think': ['consider', 'believe', 'assess', 'evaluate'],
  'say': ['state', 'mention', 'express', 'note'],
  'look': ['examine', 'inspect', 'observe', 'review'],
};

const ADJECTIVE_SYNONYMS = {
  'big': ['significant', 'substantial', 'considerable', 'large'],
  'small': ['minor', 'modest', 'limited', 'compact'],
  'good': ['effective', 'strong', 'solid', 'favorable'],
  'bad': ['poor', 'inadequate', 'unfavorable', 'problematic'],
  'important': ['critical', 'essential', 'vital', 'significant'],
  'different': ['distinct', 'varied', 'diverse', 'unique'],
  'new': ['novel', 'recent', 'emerging', 'modern'],
  'old': ['established', 'traditional', 'long-standing', 'mature'],
  'many': ['numerous', 'various', 'multiple', 'several'],
  'hard': ['challenging', 'demanding', 'complex', 'difficult'],
  'easy': ['straightforward', 'simple', 'accessible', 'manageable'],
  'fast': ['rapid', 'swift', 'efficient', 'prompt'],
};

const CONNECTOR_SYNONYMS = {
  'also': ['additionally', 'moreover', 'furthermore', 'likewise'],
  'but': ['however', 'yet', 'nevertheless', 'nonetheless'],
  'so': ['therefore', 'consequently', 'thus', 'as a result'],
  'then': ['subsequently', 'afterward', 'next', 'following this'],
  'because': ['since', 'given that', 'as', 'owing to the fact that'],
};

const SENTENCE_STARTER_ALTERNATIVES = {
  'the': ['This', 'A', 'One', 'Such a'],
  'it': ['This', 'That', 'The process', 'The outcome'],
  'there': ['Several', 'Multiple', 'Various', 'A number of'],
  'this': ['The', 'Such', 'That particular', 'The aforementioned'],
  'these': ['Such', 'The', 'Those', 'Several'],
};

const ALL_SYNONYMS = { ...VERB_SYNONYMS, ...ADJECTIVE_SYNONYMS, ...CONNECTOR_SYNONYMS };

// ─── Helper Functions ───────────────────────────────────────────────

function buildProtectedSet(analysis) {
  const protect = new Set();
  if (analysis) {
    (analysis.technicalTerms || []).forEach(t => {
      protect.add(t.toLowerCase());
      t.split(/\s+/).forEach(w => protect.add(w.toLowerCase()));
    });
    if (analysis.namedEntities) {
      (analysis.namedEntities.names || []).forEach(n => {
        n.split(/\s+/).forEach(w => protect.add(w.toLowerCase()));
      });
      (analysis.namedEntities.dates || []).forEach(d => protect.add(d.toLowerCase()));
    }
  }
  return protect;
}

function isProtectedWord(word, protectedSet) {
  const lower = word.toLowerCase().replace(/[^a-z]/g, '');
  if (protectedSet.has(lower)) return true;
  // Capitalized words (likely proper nouns) — protect
  if (/^[A-Z]/.test(word) && word.length > 1) return true;
  // Numbers
  if (/\d/.test(word)) return true;
  return false;
}

function pickSynonym(word, usedSynonyms) {
  const lower = word.toLowerCase().replace(/[^a-z]/g, '');
  const options = ALL_SYNONYMS[lower];
  if (!options) return null;

  // Pick a synonym not yet used in this chunk
  for (const syn of options) {
    if (!usedSynonyms.has(syn)) {
      usedSynonyms.add(syn);
      // Preserve original casing
      if (word[0] === word[0].toUpperCase()) {
        return syn.charAt(0).toUpperCase() + syn.slice(1);
      }
      return syn;
    }
  }
  return null;
}

function diversifySentenceStarter(sentence, prevStarters, protectedSet) {
  const firstWord = sentence.split(/\s+/)[0] || '';
  const lower = firstWord.toLowerCase().replace(/[^a-z]/g, '');

  if (isProtectedWord(firstWord, protectedSet)) return sentence;

  const alts = SENTENCE_STARTER_ALTERNATIVES[lower];
  if (!alts) return sentence;

  // Only replace if this starter was already used
  if (!prevStarters.has(lower)) {
    prevStarters.add(lower);
    return sentence;
  }

  for (const alt of alts) {
    const altLower = alt.toLowerCase();
    if (!prevStarters.has(altLower)) {
      prevStarters.add(altLower);
      return alt + sentence.slice(firstWord.length);
    }
  }
  return sentence;
}

// ─── Main Stage ─────────────────────────────────────────────────────

const lexicalDiversifier = {
  name: 'lexical',

  async execute(ctx) {
    const text = ctx.cleanText || ctx.extractedText || ctx.rawText || '';
    const protectedSet = buildProtectedSet(ctx.analysis);
    const maxReplacements = config.lexical.maxReplacementsPerChunk;

    const lines = text.split('\n');
    const processedLines = [];
    let totalReplacements = 0;
    let inCodeBlock = false;

    for (const line of lines) {
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        processedLines.push(line);
        continue;
      }

      if (inCodeBlock || /^#{1,6}\s/.test(line.trim()) || /^[\-\*\•]\s/.test(line.trim()) ||
          /^\d+[\.\)]\s/.test(line.trim()) || /^>\s/.test(line.trim()) || /^\s{4}/.test(line)) {
        processedLines.push(line);
        continue;
      }

      // Process sentences within the line
      const sentences = line.match(/[^.!?]+[.!?]+/g) || [line];
      const usedSynonyms = new Set();
      const prevStarters = new Set();
      const processedSentences = [];

      for (const sentence of sentences) {
        let s = sentence.trim();

        // Diversify sentence starters
        s = diversifySentenceStarter(s, prevStarters, protectedSet);

        // Replace individual words
        const words = s.split(/(\s+)/); // preserve whitespace
        let chunkReplacements = 0;

        const replaced = words.map(w => {
          if (/^\s+$/.test(w)) return w; // whitespace token
          if (chunkReplacements >= maxReplacements) return w;
          if (isProtectedWord(w, protectedSet)) return w;

          const cleanW = w.replace(/[^a-zA-Z]/g, '');
          if (cleanW.length < config.lexical.minWordLength) return w;

          const syn = pickSynonym(cleanW, usedSynonyms);
          if (syn) {
            chunkReplacements++;
            totalReplacements++;
            // Preserve surrounding punctuation
            const prefix = w.match(/^[^a-zA-Z]*/)[0];
            const suffix = w.match(/[^a-zA-Z]*$/)[0];
            return prefix + syn + suffix;
          }
          return w;
        });

        processedSentences.push(replaced.join(''));
      }

      processedLines.push(processedSentences.join(' '));
    }

    ctx.cleanText = processedLines.join('\n');

    Logger.info(this.name, `Lexical diversification complete`, { replacements: totalReplacements });
  },
};

module.exports = lexicalDiversifier;
