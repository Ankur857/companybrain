import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import apiRouter from './routes/api.js';

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

// Root Welcome
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to CompanyBrain Platform API',
    version: '1.0.0',
    philosophy: 'Right information. Right person. Right permission.',
    docs: '/api/health',
  });
});

// Centralized 404 Handler
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
