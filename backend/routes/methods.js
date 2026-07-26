const express = require('express');
const router = express.Router();
const { getMethodPipeline } = require('../services/pipeline/methods');

/**
 * Method routes: POST /api/method1 through /api/method5
 *
 * Each route accepts { text } in the body, passes it through the
 * multi-stage document processing pipeline for the selected method,
 * and returns { result, method, report }.
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

      const pipeline = getMethodPipeline(methodNum);

      // Execute document processing pipeline
      const { result, report } = await pipeline.run(text.trim());

      // Response preserves original contract while including evaluation report
      res.json({
        result,
        method: methodNum,
        report,
      });
    } catch (error) {
      console.error(`Method ${methodNum} error:`, error);
      res.status(500).json({
        error: 'Rewrite failed',
        message: error.message || 'An error occurred while processing your text.',
      });
    }
  });
});

module.exports = router;
