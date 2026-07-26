/**
 * Stage 1 — Document Analyzer
 *
 * Pure JavaScript document analysis — zero AI calls.
 * Extracts comprehensive metadata for every downstream pipeline stage.
 *
 * Metrics:
 * - sentenceCount, paragraphCount, avgSentenceLength, sentenceLengthVariance
 * - repeatedSentenceOpenings, repeatedTransitions
 * - passiveVoiceRatio, lexicalDiversity, vocabularyRichness
 * - technicalTerms, namedEntities, headings, lists
 * - readabilityScore, writingProfile
 */

const Logger = require('../Logger');

// ─── Common Non-Name Words Filter ──────────────────────────────────
const COMMON_WORDS_FILTER = new Set([
  'Together', 'Since', 'However', 'Furthermore', 'Moreover', 'Additionally',
  'Consequently', 'Therefore', 'Nevertheless', 'Meanwhile', 'Digital',
  'Cryptography', 'Cryptographic', 'Symmetric', 'Asymmetric', 'Overview',
  'Introduction', 'Conclusion', 'Background', 'Methodology', 'Results',
  'Discussion', 'Section', 'Chapter', 'Figure', 'Table', 'Algorithm',
  'System', 'Process', 'Analysis', 'Development', 'Implementation',
  'Application', 'Technology', 'Information', 'Security', 'Data',
  'Network', 'Software', 'Hardware', 'Performance', 'Evaluation'
]);

// ─── Utility Functions ──────────────────────────────────────────────

function getWords(text) {
  return text.trim().split(/\s+/).filter(w => w.length > 0);
}

function getSentences(text) {
  const cleaned = text
    .replace(/\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|etc|vs|e\.g|i\.e)\./gi, '$1\u0000')
    .replace(/(\d)\./g, '$1\u0000');
  const raw = cleaned.match(/[^.!?]+[.!?]+/g) || [cleaned];
  return raw
    .map(s => s.replace(/\u0000/g, '.').trim())
    .filter(s => s.length > 0);
}

function getParagraphs(text) {
  return text.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);
}

function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 2) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

function fleschKincaidScore(wordCount, sentenceCount, syllableCount) {
  if (sentenceCount === 0 || wordCount === 0) return 0;
  const score = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount);
  return parseFloat(Math.max(0, Math.min(100, score)).toFixed(1));
}

// ─── Repeated Patterns ─────────────────────────────────────────────

function findRepeatedSentenceOpenings(sentences) {
  const openings = {};
  for (const s of sentences) {
    const words = s.split(/\s+/).slice(0, 3)
      .map(w => w.toLowerCase().replace(/[^a-z]/g, ''))
      .filter(Boolean);
    if (words.length >= 2) {
      const key = words.slice(0, 2).join(' ');
      openings[key] = (openings[key] || 0) + 1;
    }
  }
  return Object.entries(openings)
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([opening, count]) => ({ opening, count }));
}

function findRepeatedTransitions(text) {
  const transitions = [
    'however', 'furthermore', 'moreover', 'additionally', 'consequently',
    'nevertheless', 'therefore', 'subsequently', 'meanwhile', 'nonetheless',
    'in addition', 'as a result', 'on the other hand', 'in conclusion',
    'for example', 'in contrast', 'similarly', 'likewise', 'specifically',
    'notably', 'indeed', 'certainly', 'undoubtedly', 'essentially',
  ];
  const lower = text.toLowerCase();
  return transitions
    .map(t => ({ transition: t, count: (lower.split(t).length - 1) }))
    .filter(t => t.count >= 2)
    .sort((a, b) => b.count - a.count);
}

function findRepeatedPhrases(words, n, minCount) {
  const ngrams = {};
  const lowerWords = words.map(w => w.toLowerCase().replace(/[^a-z']/g, ''));
  for (let i = 0; i <= lowerWords.length - n; i++) {
    const gram = lowerWords.slice(i, i + n).join(' ');
    if (gram.length < 5) continue;
    ngrams[gram] = (ngrams[gram] || 0) + 1;
  }
  return Object.entries(ngrams)
    .filter(([, c]) => c >= minCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([phrase, count]) => ({ phrase, count }));
}

// ─── Term & Entity Detection ────────────────────────────────────────

function detectTechnicalTerms(text) {
  const terms = new Set();
  (text.match(/\b[A-Z]{2,}\b/g) || []).forEach(a => terms.add(a));
  (text.match(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g) || []).forEach(t => terms.add(t));
  (text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g) || []).forEach(m => {
    // Only add if not newline-separated
    if (!m.includes('\n')) terms.add(m);
  });
  return [...terms].slice(0, 40);
}

function detectNamedEntities(text) {
  const entities = { names: [], dates: [], numbers: [] };

  // Dates
  const datePatterns = text.match(/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s*\d{4}\b|\b\d{4}\b/gi) || [];
  entities.dates = [...new Set(datePatterns)].slice(0, 20);

  // Numbers with units
  const numberPatterns = text.match(/\b\d+(?:\.\d+)?(?:\s*%|\s*(?:million|billion|thousand|kg|km|mb|gb|tb|ms|hz)s?)\b/gi) || [];
  entities.numbers = [...new Set(numberPatterns)].slice(0, 20);
  const standaloneNums = text.match(/\b\d{2,}\b/g) || [];
  standaloneNums.forEach(n => { if (!entities.numbers.includes(n)) entities.numbers.push(n); });
  entities.numbers = entities.numbers.slice(0, 30);

  // Proper names: look for Honorific + Name or multi-word Title Case names inside sentences
  const nameMatches = text.match(/\b(?:Mr|Mrs|Ms|Dr|Prof)\.\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b|\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g) || [];
  const cleanNames = nameMatches
    .map(n => n.trim())
    .filter(n => {
      if (n.includes('\n')) return false; // ignore newline breaks
      const parts = n.split(/\s+/);
      // Filter out common sentence starters / headings
      return parts.every(p => !COMMON_WORDS_FILTER.has(p.replace(/[^a-zA-Z]/g, '')));
    });

  entities.names = [...new Set(cleanNames)].slice(0, 20);
  return entities;
}

function detectHeadings(text) {
  const lines = text.split('\n');
  const headings = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    if (
      /^#{1,6}\s/.test(t) ||
      (t.length < 80 && t === t.toUpperCase() && /[A-Z]/.test(t) && !/[.!?]$/.test(t)) ||
      (t.length < 80 && /^\d+\.\s+[A-Z]/.test(t) && !/[.!?]$/.test(t))
    ) {
      headings.push(t);
    }
  }
  return headings;
}

function detectLists(text) {
  const items = text.match(/^[\-\*\•]\s.+$|^\d+[\.\)]\s.+$/gm) || [];
  return items.map(i => i.trim());
}

// ─── Passive Voice ──────────────────────────────────────────────────

function estimatePassiveVoice(sentences) {
  if (sentences.length === 0) return 0;
  const passivePattern = /\b(is|are|was|were|been|being|be|get|gets|got|gotten)\s+(?:\w+\s+)*\w+ed\b/i;
  const count = sentences.filter(s => passivePattern.test(s)).length;
  return parseFloat(((count / sentences.length) * 100).toFixed(1));
}

// ─── Writing Profile Estimation ─────────────────────────────────────

function estimateWritingProfile(text, avgSentenceLen, passiveRatio, techTermCount, readability) {
  const lower = text.toLowerCase();

  const academicTerms = ['hypothesis', 'methodology', 'framework', 'empirical', 'literature', 'consequently', 'furthermore', 'moreover', 'thus', 'albeit', 'paradigm', 'theoretical'];
  if (academicTerms.filter(t => lower.includes(t)).length >= 3 || (passiveRatio > 25 && avgSentenceLen > 22 && readability < 50)) {
    return 'academic';
  }

  if (techTermCount >= 4 || /```|function\s*\(|=>|api|database|algorithm|server|endpoint|protocol/i.test(text)) {
    return 'technical';
  }

  const blogPronouns = (lower.match(/\b(you|your|we|our|i|my|me)\b/g) || []).length;
  if (blogPronouns >= 5 && avgSentenceLen < 16 && passiveRatio < 12) {
    return 'blog';
  }

  const businessTerms = ['strategy', 'objective', 'growth', 'market', 'revenue', 'implementation', 'stakeholder', 'deliverable', 'roi', 'kpi'];
  if (businessTerms.filter(t => lower.includes(t)).length >= 2) {
    return 'business';
  }

  return 'student_friendly';
}

// ─── Main Stage ─────────────────────────────────────────────────────

const analyzer = {
  name: 'analyzer',

  async execute(ctx) {
    const text = ctx.extractedText || ctx.cleanText || ctx.rawText || '';
    const words = getWords(text);
    const sentences = getSentences(text);
    const paragraphs = getParagraphs(text);

    const totalWords = words.length;
    const totalSentences = sentences.length;
    const totalParagraphs = paragraphs.length;

    const avgSentenceLength = totalSentences > 0
      ? parseFloat((totalWords / totalSentences).toFixed(1)) : 0;
    const avgParagraphLength = totalParagraphs > 0
      ? parseFloat((totalWords / totalParagraphs).toFixed(1)) : 0;

    // Sentence length variance
    const sentenceLengths = sentences.map(s => getWords(s).length);
    const mean = sentenceLengths.reduce((a, b) => a + b, 0) / Math.max(1, sentenceLengths.length);
    const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / Math.max(1, sentenceLengths.length);
    const sentenceLengthVariance = parseFloat(Math.sqrt(variance).toFixed(2));

    // Lexical diversity
    const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z']/g, '')));
    const lexicalDiversity = totalWords > 0
      ? parseFloat((uniqueWords.size / totalWords).toFixed(3)) : 0;
    const richWords = [...uniqueWords].filter(w => w.length >= 6);
    const vocabularyRichness = totalWords > 0
      ? parseFloat((richWords.length / totalWords).toFixed(3)) : 0;

    // Readability
    const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
    const readabilityScore = fleschKincaidScore(totalWords, totalSentences, totalSyllables);

    const passiveVoiceRatio = estimatePassiveVoice(sentences);
    const repeatedSentenceOpenings = findRepeatedSentenceOpenings(sentences);
    const repeatedTransitions = findRepeatedTransitions(text);
    const repeatedPhrases = findRepeatedPhrases(words, 3, 3);
    const technicalTerms = detectTechnicalTerms(text);
    const namedEntities = detectNamedEntities(text);
    const headings = detectHeadings(text);
    const lists = detectLists(text);

    const writingProfile = (ctx.options && ctx.options.profile)
      ? ctx.options.profile
      : estimateWritingProfile(text, avgSentenceLength, passiveVoiceRatio, technicalTerms.length, readabilityScore);

    ctx.analysis = {
      totalWords,
      totalSentences,
      totalParagraphs,
      avgSentenceLength,
      avgParagraphLength,
      sentenceLengthVariance,
      lexicalDiversity,
      vocabularyRichness,
      readabilityScore,
      passiveVoiceRatio,
      repeatedSentenceOpenings,
      repeatedTransitions,
      repeatedPhrases,
      technicalTerms,
      namedEntities,
      headings,
      lists,
      writingProfile,
    };

    Logger.info(this.name,
      `${totalWords} words, ${totalSentences} sentences, ${totalParagraphs} paragraphs`,
      { profile: writingProfile, readability: readabilityScore, passive: passiveVoiceRatio + '%', lexDiv: lexicalDiversity }
    );
  },
};

module.exports = analyzer;
