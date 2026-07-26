/**
 * Method 3 — Analysis → Structure → Lexical Diversification → Rewrite → Style Refinement → Validation
 */
const PipelineRunner = require('../PipelineRunner');
const analyzer = require('../stages/analyzer');
const structural = require('../stages/preprocessor');
const lexical = require('../stages/lexicalDiversifier');
const chunker = require('../stages/chunker');
const rewriter = require('../stages/rewriter');
const styleRefiner = require('../stages/styleRefiner');
const validator = require('../stages/validator');
const assembler = require('../stages/assembler');

const stages = [analyzer, structural, lexical, chunker, rewriter, styleRefiner, validator, assembler];
const runner = new PipelineRunner('Method 3: Lexical + Style', stages);

module.exports = { run: (text, opts) => runner.run(text, 3, opts), stages };
