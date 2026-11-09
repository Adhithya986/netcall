import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('[Error Middleware]', err);

  if (err instanceof ZodError || err.name === 'ZodError') {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      issues: err.errors ? err.errors.map((e: any) => ({
        field: e.path ? e.path.join('.') : '',
        message: e.message
      })) : []
    });
    return;
  }

  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: err.message
    });
    return;
  }

  // Client errors (duplicate accounts, invalid credentials, suspended, insufficient balance)
  const clientErrors = [
    'already exists',
    'Invalid email',
    'Invalid or expired',
    'Insufficient balance',
    'suspended',
    'not found',
    'Destination user',
    'Cannot initiate a call to your own'
  ];

  if (clientErrors.some(sub => (err.message || '').includes(sub))) {
    res.status(400).json({
      success: false,
      error: err.message
    });
    return;
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    res.status(409).json({
      success: false,
      error: `An account with this ${field} already exists.`
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message
  });
}
