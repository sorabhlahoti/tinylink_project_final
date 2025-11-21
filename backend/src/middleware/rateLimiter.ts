import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per window
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for redirect endpoint (high traffic)
export const redirectLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: parseInt(process.env.REDIRECT_RATE_LIMIT_MAX || '1000'), // 1000 requests per minute
  message: 'Too many redirects, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Strict rate limiter for link creation
export const createLinkLimiter = rateLimit({
  windowMs: 3600000, // 1 hour
  max: 50, // 50 links per hour
  message: 'Too many links created, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});