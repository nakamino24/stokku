import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { AppError } from '../utils/errors';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw AppError.unauthorized('Access token required');
    }

    const token = authHeader.split(' ')[1];
    const payload = AuthService.verifyAccessToken(token);
    (req as any).user = payload;
    next();
  } catch (error) {
    next(error);
  }
};
