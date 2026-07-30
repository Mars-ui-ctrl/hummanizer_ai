/**
 * Method 1 — Anti-Detection Multi-Stage Humanizer Pipeline (Streamlined Single AI Pass)
 *
 * Streamlined to 1 single AI pass per chunk to guarantee zero 429 rate limits even on 5k+ word PDFs,
 * followed by pure JS NLP post-processing passes.
 *
 * Sequence:
 * 1. Analyzer            — Document analysis (entities, terms, structure)
 * 2. Chunker             — Paragraph-boundary chunking with context overlap
 * 3. Rewriter            — Core AI humanization pass (1 AI call per chunk)
 * 4. Entity Variation    — Pure JS NLP entity detection & descriptive phrase substitution (0ms)
 * 5. Sentence Restr.     — Pure JS sentence burstiness, contractions & opener variation (0ms)
 * 6. Human Imperfection  — Pure JS human syntactic noise (dropped 'that', openers, em-dashes) (0ms)
 * 7. AI Phrase Cleaner   — Pure JS regex engine stripping 100+ AI conversational templates (0ms)
 * 8. Validator           — Pure JS rule-based quality checks (words, names, numbers, headings) (0ms)
 * 9. Assembler           — Pure JS chunk reassembly into final document (0ms)
 */
const PipelineRunner = require('../PipelineRunner');
const analyzer = require('../stages/analyzer');
const chunker = require('../stages/chunker');
const rewriter = require('../stages/rewriter');
const entityVariation = require('../stages/entityVariation');
const sentenceRestructurer = require('../stages/sentenceRestructurer');
const humanImperfection = require('../stages/humanImperfection');
const aiPhraseCleaner = require('../stages/aiPhraseCleaner');
const validator = require('../stages/validator');
const assembler = require('../stages/assembler');

const stages = [
  analyzer,
  chunker,
  rewriter,
  entityVariation,
  sentenceRestructurer,
  humanImperfection,
  aiPhraseCleaner,
  validator,
  assembler,
];

const runner = new PipelineRunner('Method 1: Streamlined Anti-Detection Humanizer', stages);

module.exports = { run: (text, opts) => runner.run(text, 1, opts), stages };
