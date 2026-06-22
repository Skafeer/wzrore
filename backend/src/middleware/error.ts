import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error(`${req.method} ${req.originalUrl} — ${err.message}`, {
    stack: err.stack,
    body: req.body,
  });

  res.status(500).json({
    success: false,
    message: 'حدث خطأ في الخادم',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}

export function notFound(req: Request, res: Response): void {
  logger.warn(`404 — ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'المسار غير موجود',
  });
}