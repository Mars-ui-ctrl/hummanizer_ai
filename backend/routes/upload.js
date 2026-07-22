const express = require('express');
const multer = require('multer');
const router = express.Router();

// Configure multer for memory storage (no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

/**
 * Extract text from a PDF buffer using pdfjs-dist.
 * Uses dynamic import since pdfjs-dist is ESM.
 */
async function extractTextFromPdf(buffer) {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    // Enable recovery for malformed PDFs
    stopAtErrors: false,
  });

  const pdf = await loadingTask.promise;
  const pageTexts = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const lines = [];
    let lastY = null;

    for (const item of content.items) {
      if (item.str === undefined) continue;
      // Detect line breaks via Y-position changes
      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 2) {
        lines.push('\n');
      }
      lines.push(item.str);
      lastY = item.transform[5];
    }

    pageTexts.push(lines.join(''));
  }

  return {
    text: pageTexts.join('\n\n'),
    numpages: pdf.numPages,
  };
}

/**
 * POST /api/upload
 * Accepts a PDF file, extracts text, and returns it.
 */
router.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please upload a PDF file.',
      });
    }

    const pdfData = await extractTextFromPdf(req.file.buffer);

    if (!pdfData.text || pdfData.text.trim().length === 0) {
      return res.status(400).json({
        error: 'No text found',
        message:
          'The PDF does not contain extractable text. It may be a scanned document or contain only images.',
      });
    }

    // Clean up extracted text while preserving paragraph structure
    let cleanedText = pdfData.text
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      // Remove excessive whitespace within lines
      .replace(/[ \t]+/g, ' ')
      // Preserve paragraph breaks (double newlines) but collapse triple+
      .replace(/\n{3,}/g, '\n\n')
      // Trim each line
      .split('\n')
      .map((line) => line.trim())
      .join('\n')
      .trim();

    res.json({
      text: cleanedText,
      pages: pdfData.numpages,
      filename: req.file.originalname,
    });
  } catch (error) {
    console.error('PDF upload error:', error);

    if (error.message === 'Only PDF files are allowed') {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only PDF files are accepted.',
      });
    }

    res.status(500).json({
      error: 'PDF processing failed',
      message: 'Failed to extract text from the PDF file.',
    });
  }
});

// Handle multer errors
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'PDF file must be under 20MB.',
      });
    }
  }
  next(err);
});

module.exports = router;

