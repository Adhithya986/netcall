import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const generalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // limit each IP to 25 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again after 15 minutes.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  }
});

export const callRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // max 15 call initiations per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Call rate limit exceeded. Please wait a moment before placing another call.',
    code: 'CALL_RATE_LIMIT_EXCEEDED'
  }
});

