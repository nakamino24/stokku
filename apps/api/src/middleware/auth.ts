import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors';
import { config } from '../config';

export const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw AppError.unauthorized('Access token required');
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, config.jwt.accessSecret) as jwt.JwtPayload;
    (req as any).user = {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      organizationId: payload.organizationId,
      organizationSlug: payload.organizationSlug,
    };
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(AppError.unauthorized('Invalid or expired token'));
    } else {
      next(error);
    }
  }
};
