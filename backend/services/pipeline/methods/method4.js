/**
 * Method 4 — Analysis → Structure → Rewrite → Style Refinement → Diversity Pass → Validation
 */
const PipelineRunner = require('../PipelineRunner');
const analyzer = require('../stages/analyzer');
const structural = require('../stages/preprocessor');
const chunker = require('../stages/chunker');
const rewriter = require('../stages/rewriter');
const styleRefiner = require('../stages/styleRefiner');
const diversityPass = require('../stages/diversityPass');
const validator = require('../stages/validator');
const assembler = require('../stages/assembler');

const stages = [analyzer, structural, chunker, rewriter, styleRefiner, diversityPass, validator, assembler];
const runner = new PipelineRunner('Method 4: Style + Diversity', stages);

module.exports = { run: (text, opts) => runner.run(text, 4, opts), stages };
