/**
 * Method 1 — 7-Stage Anti-Detection Pipeline
 *
 * Sequence:
 * 1. Semantic Chunker      (Pure JS: ~800-1000 word paragraph boundary chunking, 1-sentence overlap)
 * 2. Pass 1 Destructor     (AI Pass 1: Gemini 0.85 Temp / 0.90 TopP - Structural Destruction & Fact Lock)
 * 3. Pass 2 Normalizer     (AI Pass 2: Gemini 0.60 Temp / 0.85 TopP - Perplexity Normalization & 2 AM Student Voice)
 * 4. Lexical Diversifier   (Pure JS: High to Low probability AI-word replacement with capitalization preservation)
 * 5. Burstiness Enforcer   (Pure JS: Paragraph rhythm [micro-sentence] + [compound run-on sentence])
 * 6. Fact & Format Valid.  (Pure JS: Verifies all numbers/dates exist & word count ratio is 85%-130%)
 * 7. Document Assembler    (Pure JS: Double-newline chunk stitching)
 */

const PipelineRunner = require('../PipelineRunner');
const chunker = require('../stages/chunker');
const pass1Destructor = require('../stages/pass1Destructor');
const pass2Normalizer = require('../stages/pass2Normalizer');
const lexicalDiversifier = require('../stages/lexicalDiversifier');
const burstinessEnforcer = require('../stages/burstinessEnforcer');
const validator = require('../stages/validator');
const assembler = require('../stages/assembler');

const stages = [
  chunker,
  pass1Destructor,
  pass2Normalizer,
  lexicalDiversifier,
  burstinessEnforcer,
  validator,
  assembler,
];

const runner = new PipelineRunner('Method 1: 7-Stage Anti-Detection Pipeline', stages);

module.exports = { run: (text, opts) => runner.run(text, 1, opts), stages };
