/**
 * Pipeline Configuration
 *
 * Central configuration for the entire document processing pipeline.
 * All tunable values live here — no hardcoded numbers in stage files.
 */

module.exports = {
  // Chunking
  chunking: {
    targetWords: 900,
    minChunkWords: 300,
    maxChunkWords: 1200,
    overlapSentences: 2,
  },

  // AI Generation Temperatures
  temperatures: {
    rewrite: 0.75,
    styleRefine: 0.55,
    diversityPass: 0.60,
    finalPolish: 0.35,
    evaluation: 0.3,
  },

  // Validation Thresholds
  validation: {
    minWordRatio: 0.85,
    maxWordRatio: 1.15,
    maxRetries: 2,
    minParagraphRatio: 0.5,
    technicalTermThreshold: 0.6,
    headingThreshold: 0.7,
  },

  // Structural Transformation
  structural: {
    longSentenceThreshold: 40,
    shortSentenceThreshold: 6,
    shortSentenceMergeMax: 3,
  },

  // Lexical Diversification
  lexical: {
    maxReplacementsPerChunk: 15,
    minWordLength: 4,
  },

  // Cache
  cache: {
    enabled: true,
    maxEntries: 200,
    ttlMs: 30 * 60 * 1000,
  },

  // Timeouts
  timeouts: {
    aiCallMs: 60000,
    totalPipelineMs: 300000,
  },
};
