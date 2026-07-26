/**
 * Structured Pipeline Logger
 *
 * Provides consistent, structured log output for all pipeline operations.
 * Logs pipeline stage, execution time, retries, validation failures,
 * chunk indices, and API failures in a parseable format.
 */

const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const CURRENT_LEVEL = LOG_LEVELS.INFO;

function timestamp() {
  return new Date().toISOString();
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function log(level, stage, message, meta = {}) {
  if (LOG_LEVELS[level] < CURRENT_LEVEL) return;

  const entry = {
    time: timestamp(),
    level,
    stage,
    message,
    ...meta,
  };

  const prefix = {
    DEBUG: '🔍',
    INFO: '✓',
    WARN: '⚠️',
    ERROR: '❌',
  }[level] || '•';

  const metaStr = Object.keys(meta).length
    ? ` | ${Object.entries(meta).map(([k, v]) => `${k}=${v}`).join(' ')}`
    : '';

  console.log(`  ${prefix} [${stage}] ${message}${metaStr}`);
  return entry;
}

const Logger = {
  debug: (stage, msg, meta) => log('DEBUG', stage, msg, meta),
  info: (stage, msg, meta) => log('INFO', stage, msg, meta),
  warn: (stage, msg, meta) => log('WARN', stage, msg, meta),
  error: (stage, msg, meta) => log('ERROR', stage, msg, meta),

  stageStart: (stageName, meta = {}) => {
    log('INFO', stageName, 'Stage started', meta);
  },

  stageComplete: (stageName, durationMs, meta = {}) => {
    log('INFO', stageName, `Stage completed in ${formatDuration(durationMs)}`, meta);
  },

  chunkProgress: (stageName, chunkIndex, totalChunks, meta = {}) => {
    log('INFO', stageName, `Chunk ${chunkIndex + 1}/${totalChunks}`, meta);
  },

  retry: (stageName, chunkIndex, attempt, reason) => {
    log('WARN', stageName, `Retry chunk ${chunkIndex + 1}, attempt ${attempt}: ${reason}`);
  },

  validationFail: (stageName, chunkIndex, reasons) => {
    log('WARN', stageName, `Validation failed for chunk ${chunkIndex + 1}: ${reasons.join(', ')}`);
  },

  pipelineStart: (methodName, wordCount) => {
    console.log(`\n📄 Pipeline [${methodName}] started (${wordCount} words)`);
  },

  pipelineComplete: (methodName, durationMs, inputWords, outputWords) => {
    console.log(
      `✨ Pipeline [${methodName}] completed in ${formatDuration(durationMs)} | ${inputWords} → ${outputWords} words\n`
    );
  },

  formatDuration,
};

module.exports = Logger;
