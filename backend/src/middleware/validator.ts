import { Request, Response, NextFunction } from 'express';
import { isValidUrl, isValidCode } from '../utils/urlValidator';
import { AppError } from './errorHandler';

// Validate link creation request
export function validateCreateLink(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { target_url, code } = req.body;

  // Validate target URL
  if (!target_url || !isValidUrl(target_url)) {
    throw new AppError(400, 'Invalid or missing target URL. Must be http or https.');
  }

  // Validate custom code if provided
  if (code && !isValidCode(code)) {
    throw new AppError(400, 'Invalid code format. Must be 6-8 alphanumeric characters.');
  }

  next();
}

// Validate code parameter in URL
export function validateCodeParam(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { code } = req.params;

  if (!code || !isValidCode(code)) {
    throw new AppError(400, 'Invalid code format');
  }

  next();
}