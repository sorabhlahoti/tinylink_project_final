import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { redirectAndTrack } from '../services/linkService';
import { redirectLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * Redirect endpoint - handles /:code redirects
 */
router.get(
  '/:code',
  redirectLimiter,
  asyncHandler(async (req, res) => {
    const { code } = req.params;
    
    // Extract analytics data from request
    const referrer = req.get('referer') || null;
    const userAgent = req.get('user-agent') || null;
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    
    // Redirect and track (throws 404 if not found)
    const targetUrl = await redirectAndTrack(code, referrer, userAgent, ipAddress);
    
    // Perform redirect
    res.redirect(302, targetUrl);
  })
);

export default router;