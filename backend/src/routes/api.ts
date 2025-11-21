import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validateCreateLink, validateCodeParam } from '../middleware/validator';
import { createLinkLimiter, apiLimiter } from '../middleware/rateLimiter';
import {
  createLink,
  getAllLinks,
  getLinkByCode,
  deleteLink
} from '../services/linkService';
import {
  getLinkStats,
  exportClicksCSV,
  getAnalyticsSummary
} from '../services/analyticsService';

const router = Router();

// Apply general API rate limiting
router.use(apiLimiter);

/**
 * Health check endpoint
 */
router.get('/healthz', (req, res) => {
  res.json({ ok: true, version: '1.0' });
});

/**
 * Create a new short link
 * POST /api/links
 */
router.post(
  '/api/links',
  createLinkLimiter,
  validateCreateLink,
  asyncHandler(async (req, res) => {
    const result = await createLink(req.body);
    
    // Return 200 if reactivated, 201 if new
    const statusCode = req.body.code ? 200 : 201;
    res.status(statusCode).json(result);
  })
);

/**
 * Get all active links
 * GET /api/links
 */
router.get(
  '/api/links',
  asyncHandler(async (req, res) => {
    const links = await getAllLinks();
    res.json(links);
  })
);

/**
 * Get analytics summary
 * GET /api/links/analytics
 */
router.get(
  '/api/links/analytics',
  asyncHandler(async (req, res) => {
    const summary = await getAnalyticsSummary();
    res.json(summary);
  })
);

/**
 * Get single link with metadata
 * GET /api/links/:code
 */
router.get(
  '/api/links/:code',
  validateCodeParam,
  asyncHandler(async (req, res) => {
    const { code } = req.params;
    const link = await getLinkByCode(code);
    
    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    res.json(link);
  })
);

/**
 * Get detailed stats for a link
 * GET /api/links/:code/stats
 */
router.get(
  '/api/links/:code/stats',
  validateCodeParam,
  asyncHandler(async (req, res) => {
    const { code } = req.params;
    const stats = await getLinkStats(code);
    
    if (!stats) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    res.json(stats);
  })
);

/**
 * Export clicks as CSV
 * GET /api/links/:code/export
 */
router.get(
  '/api/links/:code/export',
  validateCodeParam,
  asyncHandler(async (req, res) => {
    const { code } = req.params;
    const csv = await exportClicksCSV(code);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${code}-clicks.csv"`);
    res.send(csv);
  })
);

/**
 * Delete (soft delete) a link
 * DELETE /api/links/:code
 */
router.delete(
  '/api/links/:code',
  validateCodeParam,
  asyncHandler(async (req, res) => {
    const { code } = req.params;
    await deleteLink(code);
    res.status(204).send();
  })
);

export default router;