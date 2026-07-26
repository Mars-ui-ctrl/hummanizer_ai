/**
 * Pipeline Runner
 *
 * Core orchestrator that accepts an ordered list of stage modules
 * and executes them sequentially. Each stage receives a shared context
 * object and passes its output forward.
 *
 * Tracks per-stage timing and generates a processing report.
 */

const Logger = require('./Logger');

function getWordCount(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

function getSentenceCount(text) {
  if (!text) return 0;
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  return sentences ? sentences.length : 1;
}

function getParagraphCount(text) {
  if (!text) return 0;
  return text.split(/\n\n+/).filter(p => p.trim()).length;
}

function calculateLexicalDiversity(text) {
  if (!text || !text.trim()) return 0;
  const words = text.trim().split(/\s+/).map(w => w.toLowerCase().replace(/[^a-z']/g, '')).filter(Boolean);
  if (words.length === 0) return 0;
  const unique = new Set(words);
  return parseFloat((unique.size / words.length).toFixed(3));
}

function estimatePassiveRatio(text) {
  if (!text) return 0;
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  if (sentences.length === 0) return 0;
  const passivePattern = /\b(is|are|was|were|been|being|be)\s+\w+ed\b/gi;
  const passiveCount = (text.match(passivePattern) || []).length;
  return parseFloat(((passiveCount / sentences.length) * 100).toFixed(1));
}

function estimateReadingScore(text) {
  if (!text) return 0;
  const words = getWordCount(text);
  const sentences = getSentenceCount(text);
  const syllables = text.split(/\s+/).reduce((sum, w) => {
    const s = w.replace(/[^a-zA-Z]/g, '').match(/[aeiouy]+/gi);
    return sum + Math.max(1, s ? s.length : 1);
  }, 0);
  if (sentences === 0 || words === 0) return 0;
  const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  return parseFloat(Math.max(0, Math.min(100, score)).toFixed(1));
}

class PipelineRunner {
  /**
   * @param {string} methodName - Human-readable method name for logging
   * @param {Array<{name: string, execute: function}>} stages - Ordered stage modules
   */
  constructor(methodName, stages) {
    this.methodName = methodName;
    this.stages = stages;
  }

  /**
   * Execute the full pipeline on input text.
   *
   * @param {string} inputText - Raw input text
   * @param {number} methodId - Method number for cache keying
   * @param {object} [options] - Optional pipeline options (e.g. profile override)
   * @returns {Promise<{result: string, report: object}>}
   */
  async run(inputText, methodId = 0, options = {}) {
    const pipelineStart = Date.now();
    const inputWords = getWordCount(inputText);

    Logger.pipelineStart(this.methodName, inputWords);

    const ctx = {
      rawText: inputText,
      methodId,
      options,
      timings: {},
      retries: 0,
      chunksProcessed: 0,
    };

    for (const stage of this.stages) {
      const stageStart = Date.now();
      Logger.stageStart(stage.name);

      try {
        await stage.execute(ctx);
      } catch (err) {
        Logger.error(stage.name, `Stage failed: ${err.message}`);
        throw new Error(`Pipeline failed at stage "${stage.name}": ${err.message}`);
      }

      const duration = Date.now() - stageStart;
      ctx.timings[stage.name] = duration;
      Logger.stageComplete(stage.name, duration);
    }

    const totalDuration = Date.now() - pipelineStart;
    const outputWords = getWordCount(ctx.result || '');

    Logger.pipelineComplete(this.methodName, totalDuration, inputWords, outputWords);

    // Generate comprehensive evaluation report
    const outputText = ctx.result || '';
    const report = {
      pipeline: this.methodName,
      selectedWritingProfile: ctx.analysis ? ctx.analysis.writingProfile : (options.profile || 'student_friendly'),
      stages: this.stages.map(s => s.name),
      originalWords: inputWords,
      outputWords,
      paragraphCount: getParagraphCount(outputText),
      sentenceCount: getSentenceCount(outputText),
      avgSentenceLength: parseFloat(
        (getWordCount(outputText) / Math.max(1, getSentenceCount(outputText))).toFixed(1)
      ),
      lexicalDiversity: calculateLexicalDiversity(outputText),
      passiveVoicePercent: estimatePassiveRatio(outputText),
      readabilityScore: estimateReadingScore(outputText),
      processingTimeMs: totalDuration,
      processingTime: Logger.formatDuration(totalDuration),
      chunksProcessed: ctx.chunksProcessed || 0,
      retries: ctx.retries || 0,
      timings: ctx.timings,
    };

    return {
      result: ctx.result || '',
      report,
    };
  }
}

module.exports = PipelineRunner;
