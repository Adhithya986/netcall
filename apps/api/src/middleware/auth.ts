import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UserRole } from '@netcall/shared';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  username: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Authentication token is missing or malformed'
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
      return;
    }
    res.status(401).json({
      success: false,
      error: 'Invalid authentication token'
    });
    return;
  }
}

export function requireRole(role: UserRole) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    if (req.user.role !== role) {
      res.status(403).json({ success: false, error: 'Forbidden: Insufficient privileges' });
      return;
    }
    next();
  };
}

