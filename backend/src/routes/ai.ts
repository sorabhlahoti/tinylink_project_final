import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { apiLimiter } from '../middleware/rateLimiter';
import {
  suggestVanityCodes,
  categorizeUrl,
  checkUrlSafety
} from '../services/aiService';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Apply rate limiting
router.use(apiLimiter);

/**
 * Suggest vanity codes based on seed text
 * POST /api/ai/suggest-code
 */
router.post(
  '/api/ai/suggest-code',
  asyncHandler(async (req, res) => {
    const { seed } = req.body;
    
    if (!seed || typeof seed !== 'string') {
      throw new AppError(400, 'Seed text is required');
    }
    
    const suggestions = await suggestVanityCodes(seed);
    res.json(suggestions);
  })
);

/**
 * Categorize URL and generate description
 * POST /api/ai/categorize
 */
router.post(
  '/api/ai/categorize',
  asyncHandler(async (req, res) => {
    const { url } = req.body;
    
    if (!url || typeof url !== 'string') {
      throw new AppError(400, 'URL is required');
    }
    
    const result = await categorizeUrl(url);
    res.json(result);
  })
);

/**
 * Check URL safety
 * POST /api/ai/safety-check
 */
router.post(
  '/api/ai/safety-check',
  asyncHandler(async (req, res) => {
    const { url } = req.body;
    
    if (!url || typeof url !== 'string') {
      throw new AppError(400, 'URL is required');
    }
    
    const result = await checkUrlSafety(url);
    res.json(result);
  })
);

export default router;