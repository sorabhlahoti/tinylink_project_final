import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import apiRoutes from './routes/api';
import aiRoutes from './routes/ai';
import redirectRoutes from './routes/redirect';

/**
 * Create and configure Express application
 */
export function createApp(): Express {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Allow inline scripts for frontend
  }));

  // CORS configuration
  app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
  }));

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Trust proxy (for rate limiting and IP detection behind proxies)
  app.set('trust proxy', 1);

  // API routes
  app.use(apiRoutes);
  app.use(aiRoutes);

  // Serve static frontend files in production
  if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, '../../frontend/dist');
    app.use(express.static(frontendPath));
    
    // Serve index.html for all frontend routes (SPA)
    app.get('/code/:code', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
  }

  // Redirect routes (must be last to not conflict with API routes)
  app.use(redirectRoutes);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}