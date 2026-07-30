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
    rewrite: 0.72,
    styleRefine: 0.55,
    diversityPass: 0.60,
    finalPolish: 0.55,
    evaluation: 0.3,
  },

  // Validation Thresholds
  validation: {
    minWordRatio: 0.75, // Allow natural compression down to 75%
    maxWordRatio: 1.30, // Allow natural human expansion up to 130%
    maxRetries: 1,      // Cap retries at 1 to prevent long processing delays
    minParagraphRatio: 0.4,
    technicalTermThreshold: 0.5,
    headingThreshold: 0.6,
  },

  // Structural Transformation
  structural: {
    longSentenceThreshold: 35,
    shortSentenceThreshold: 8,
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
