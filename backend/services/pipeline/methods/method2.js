/**
 * Method 2 — Analysis → Structure → Rewrite → Validation
 */
const PipelineRunner = require('../PipelineRunner');
const analyzer = require('../stages/analyzer');
const structural = require('../stages/preprocessor');
const chunker = require('../stages/chunker');
const rewriter = require('../stages/rewriter');
const validator = require('../stages/validator');
const assembler = require('../stages/assembler');

const stages = [analyzer, structural, chunker, rewriter, validator, assembler];
const runner = new PipelineRunner('Method 2: Structural Rewrite', stages);

module.exports = { run: (text, opts) => runner.run(text, 2, opts), stages };
