/**
 * Method 1 — Analysis → Rewrite → Validation
 */
const PipelineRunner = require('../PipelineRunner');
const analyzer = require('../stages/analyzer');
const chunker = require('../stages/chunker');
const rewriter = require('../stages/rewriter');
const validator = require('../stages/validator');
const assembler = require('../stages/assembler');

const stages = [analyzer, chunker, rewriter, validator, assembler];
const runner = new PipelineRunner('Method 1: Rewrite', stages);

module.exports = { run: (text, opts) => runner.run(text, 1, opts), stages };
