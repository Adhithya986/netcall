import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { registerSchema, loginSchema, refreshTokenSchema } from '@netcall/shared';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authRateLimiter, async (req: Request, res: Response, next) => {
  try {
    const validated = registerSchema.parse(req.body);
    const result = await AuthService.register(validated);
    res.status(201).json({
      success: true,
      data: result,
      message: 'Account created successfully'
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', authRateLimiter, async (req: Request, res: Response, next) => {
  try {
    const validated = loginSchema.parse(req.body);
    const result = await AuthService.login(validated);
    res.json({
      success: true,
      data: result,
      message: 'Logged in successfully'
    });
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req: Request, res: Response, next) => {
  try {
    const validated = refreshTokenSchema.parse(req.body);
    const tokens = await AuthService.refresh(validated.refreshToken);
    res.json({
      success: true,
      data: tokens
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const refreshToken = req.body?.refreshToken;
    await AuthService.logout(req.user!.userId, refreshToken);
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const user = await AuthService.getUserProfile(req.user!.userId);
    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
});

export default router;

