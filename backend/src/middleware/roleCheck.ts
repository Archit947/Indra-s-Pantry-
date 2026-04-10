import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    sendError(res, 'Unauthorized', 401);
    return;
  }
  if (req.user.role !== 'admin') {
    sendError(res, 'Forbidden: Admin access required', 403);
    return;
  }
  next();
};

export const requireUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    sendError(res, 'Unauthorized', 401);
    return;
  }
  next();
};
