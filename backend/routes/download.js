const express = require('express');
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const router = express.Router();

/**
 * POST /api/download/txt
 * Returns the text as a downloadable .txt file.
 */
router.post('/download/txt', (req, res) => {
  try {
    const { text, filename } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const outputName = filename || 'humanized-text';
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${outputName}.txt"`
    );
    res.send(text);
  } catch (error) {
    console.error('TXT download error:', error);
    res.status(500).json({ error: 'Failed to generate TXT file' });
  }
});

/**
 * POST /api/download/pdf
 * Generates a PDF from the text and returns it as a download.
 */
router.post('/download/pdf', (req, res) => {
  try {
    const { text, filename } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const outputName = filename || 'humanized-text';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${outputName}.pdf"`
    );

    const doc = new PDFDocument({
      margin: 72,
      size: 'A4',
      info: {
        Title: outputName,
        Creator: 'Humanizer AI',
      },
    });

    doc.pipe(res);

    // Set font and write text with paragraph handling
    doc.font('Helvetica').fontSize(12).lineGap(4);

    const paragraphs = text.split(/\n\n+/);
    paragraphs.forEach((paragraph, index) => {
      if (index > 0) {
        doc.moveDown(0.5);
      }
      doc.text(paragraph.replace(/\n/g, ' ').trim(), {
        align: 'left',
        lineGap: 4,
      });
    });

    doc.end();
  } catch (error) {
    console.error('PDF download error:', error);
    res.status(500).json({ error: 'Failed to generate PDF file' });
  }
});

/**
 * POST /api/download/docx
 * Generates a DOCX from the text and returns it as a download.
 */
router.post('/download/docx', async (req, res) => {
  try {
    const { text, filename } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const outputName = filename || 'humanized-text';

    // Split text into paragraphs and create DOCX document
    const paragraphs = text.split(/\n\n+/).map(
      (para) =>
        new Paragraph({
          children: [
            new TextRun({
              text: para.replace(/\n/g, ' ').trim(),
              size: 24, // 12pt
              font: 'Calibri',
            }),
          ],
          spacing: { after: 200 },
        })
    );

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${outputName}.docx"`
    );
    res.send(buffer);
  } catch (error) {
    console.error('DOCX download error:', error);
    res.status(500).json({ error: 'Failed to generate DOCX file' });
  }
});

module.exports = router;
