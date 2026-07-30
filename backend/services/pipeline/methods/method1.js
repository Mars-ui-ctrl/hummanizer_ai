/**
 * Method 1 — Multi-Stage NLP Humanization Pipeline
 *
 * The most comprehensive humanization method with 7 stages:
 *
 * 1. Analyzer         — Document analysis (entities, terms, structure)
 * 2. Chunker          — Paragraph-boundary chunking with context overlap
 * 3. Rewriter         — Core AI humanization pass (Gemini)
 * 4. Entity Variation — NLP entity detection & descriptive phrase substitution
 * 5. Sentence Restr.  — Merge short, split long, contractions, opener variation
 * 6. Idiom Polisher   — AI pass for idiomatic phrasing & tone smoothing
 * 7. Validator        — Rule-based quality checks (words, names, numbers, headings)
 * 8. Assembler        — Chunk reassembly into final document
 */
const PipelineRunner = require('../PipelineRunner');
const analyzer = require('../stages/analyzer');
const chunker = require('../stages/chunker');
const rewriter = require('../stages/rewriter');
const entityVariation = require('../stages/entityVariation');
const sentenceRestructurer = require('../stages/sentenceRestructurer');
const idiomPolisher = require('../stages/idiomPolisher');
const validator = require('../stages/validator');
const assembler = require('../stages/assembler');

const stages = [
  analyzer,
  chunker,
  rewriter,
  entityVariation,
  sentenceRestructurer,
  idiomPolisher,
  validator,
  assembler,
];

const runner = new PipelineRunner('Method 1: Multi-Stage NLP Humanizer', stages);

module.exports = { run: (text, opts) => runner.run(text, 1, opts), stages };
