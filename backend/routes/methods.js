const express = require('express');
const router = express.Router();
const { getEngine } = require('../services/engines');
const { processDocumentPipeline } = require('../services/chunker');

/**
 * Method routes: POST /api/method1 through /api/method5
 *
 * Each route accepts { text } in the body, passes it through the
 * chunking pipeline with the selected engine, and returns { result }.
 */
const METHODS = [1, 2, 3, 4, 5];

METHODS.forEach((methodNum) => {
  router.post(`/method${methodNum}`, async (req, res) => {
    try {
      const { text } = req.body;

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({
          error: 'Text is required',
          message: 'Please provide non-empty text to rewrite.',
        });
      }

      if (text.length > 200000) {
        return res.status(400).json({
          error: 'Text too long',
          message: 'Text must be under 200,000 characters.',
        });
      }

      const engine = getEngine(methodNum);

      // Process full text through the modular chunking pipeline
      const result = await processDocumentPipeline(text.trim(), (chunkText, contextText, isRetry) =>
        engine.rewrite(chunkText, contextText, isRetry)
      );

      res.json({ result, method: methodNum });
    } catch (error) {
      console.error(`Method ${methodNum} error:`, error);
      res.status(500).json({
        error: 'Rewrite failed',
        message:
          error.message || 'An error occurred while processing your text.',
      });
    }
  });
});

module.exports = router;
