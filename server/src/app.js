import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import apiRouter from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.join(__dirname, '../../client/dist');

const app = express();

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Allows flexible dashboard assets
}));

// CORS
app.use(cors({
  origin: true,
  credentials: true,
}));

// Request Logging
app.use(morgan('dev'));

// Rate Limiting for API protection
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // 1000 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount API routes
app.use('/api', apiRouter);

// Serve Static Frontend Assets (Production / Render Deployment)
if (fs.existsSync(clientDistPath)) {
  console.log('🌐 Serving production React client from:', clientDistPath);
  app.use(express.static(clientDistPath));

  // SPA Route Fallback
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // Root Welcome (Development / Standalone API)
  app.get('/', (req, res) => {
    res.json({
      message: 'Welcome to CompanyBrain Platform API',
      version: '1.0.0',
      philosophy: 'Right information. Right person. Right permission.',
      docs: '/api/health',
    });
  });
}

// Centralized 404 Handler for API endpoints
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint [${req.method} ${req.url}] not found.`,
  });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Enterprise Server Error',
  });
});

export default app;
