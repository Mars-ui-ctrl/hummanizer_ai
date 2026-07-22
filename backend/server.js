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
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check & Root
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Humanizer AI Backend API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api', methodRoutes);
app.use('/api', uploadRoutes);
app.use('/api', downloadRoutes);

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
