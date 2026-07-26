/**
 * Method 5 — Full Pipeline
 * Analysis → Structure → Lexical Diversification → Rewrite → Style Refinement → Diversity Pass → Final Polish → Validation
 */
const PipelineRunner = require('../PipelineRunner');
const analyzer = require('../stages/analyzer');
const structural = require('../stages/preprocessor');
const lexical = require('../stages/lexicalDiversifier');
const chunker = require('../stages/chunker');
const rewriter = require('../stages/rewriter');
const styleRefiner = require('../stages/styleRefiner');
const diversityPass = require('../stages/diversityPass');
const finalPolish = require('../stages/finalPolish');
const validator = require('../stages/validator');
const assembler = require('../stages/assembler');

const stages = [analyzer, structural, lexical, chunker, rewriter, styleRefiner, diversityPass, finalPolish, validator, assembler];
const runner = new PipelineRunner('Method 5: Full Pipeline', stages);

module.exports = { run: (text, opts) => runner.run(text, 5, opts), stages };
