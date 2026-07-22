const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const methodRoutes = require('./routes/methods');
const uploadRoutes = require('./routes/upload');
const downloadRoutes = require('./routes/download');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api', methodRoutes);
app.use('/api', uploadRoutes);
app.use('/api', downloadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'An unexpected error occurred',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`✨ Humanizer backend running on port ${PORT}`);
});
