const express = require('express');
const router = express.Router();
const { getEngine } = require('../services/engines');

/**
 * Method routes: POST /api/method1 through /api/method5
 *
 * Each route accepts { text } in the body, runs the corresponding
 * rewrite engine, and returns { result }.
 *
 * To add a new method, just add a new route here and create the engine file.
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

      if (text.length > 100000) {
        return res.status(400).json({
          error: 'Text too long',
          message: 'Text must be under 100,000 characters.',
        });
      }

      const engine = getEngine(methodNum);
      const result = await engine.rewrite(text.trim());

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
