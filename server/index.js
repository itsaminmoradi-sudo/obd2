import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import healthRouter from './routes/health.js';
import apiRouter from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './middleware/logger.js';
import { corsConfig } from './middleware/corsConfig.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(logger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsConfig()));

// Health check endpoint for Render monitoring
app.use('/health', healthRouter);

// API routes
app.use('/api', apiRouter);

// Serve vanilla static frontend by default
const vanillaPath = path.join(__dirname, '../frontend');
app.use(express.static(vanillaPath));

// Optionally serve the React build (if present) under /react
const reactDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(reactDistPath)) {
  app.use('/react', express.static(reactDistPath));

  app.get('/react/*', (req, res) => {
    res.sendFile(path.join(reactDistPath, 'index.html'));
  });
}

// SPA fallback for non-API routes (vanilla uses hash routing, but keep deep links resilient)
app.get(/^\/(?!api|health|react).*/, (req, res) => {
  res.sendFile(path.join(vanillaPath, 'index.html'), (err) => {
    if (err) {
      res.status(500).send('Error loading application');
    }
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Server running on port ${PORT} in ${NODE_ENV} mode`);
  if (process.env.RENDER === 'true') {
    console.log('[RENDER] Application deployed on Render');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
