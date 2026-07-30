/**
 * Method 1 — Multi-Stage Anti-Detection NLP Humanization Pipeline
 *
 * 1. Analyzer         — Document analysis (entities, terms, structure)
 * 2. Chunker          — Paragraph-boundary chunking with context overlap
 * 3. Rewriter         — Core AI humanization pass (Gemini, persona-based re-expression)
 * 4. Entity Variation — NLP entity detection & descriptive phrase substitution
 * 5. Sentence Restr.  — Merge short, split long, contractions, opener variation
 * 6. Idiom Polisher   — AI pass for authoritative flow & tone smoothing
 * 7. AI Phrase Cleaner— Pure JS regex engine stripping 100+ AI conversational templates
 * 8. Validator        — Rule-based quality checks (words, names, numbers, headings)
 * 9. Assembler        — Chunk reassembly into final document
 */
const PipelineRunner = require('../PipelineRunner');
const analyzer = require('../stages/analyzer');
const chunker = require('../stages/chunker');
const rewriter = require('../stages/rewriter');
const entityVariation = require('../stages/entityVariation');
const sentenceRestructurer = require('../stages/sentenceRestructurer');
const idiomPolisher = require('../stages/idiomPolisher');
const aiPhraseCleaner = require('../stages/aiPhraseCleaner');
const validator = require('../stages/validator');
const assembler = require('../stages/assembler');

const stages = [
  analyzer,
  chunker,
  rewriter,
  entityVariation,
  sentenceRestructurer,
  idiomPolisher,
  aiPhraseCleaner,
  validator,
  assembler,
];

const runner = new PipelineRunner('Method 1: Anti-Detection Multi-Stage Humanizer', stages);

module.exports = { run: (text, opts) => runner.run(text, 1, opts), stages };
