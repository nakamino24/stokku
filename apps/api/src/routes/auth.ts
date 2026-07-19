import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { z } from 'zod';
import { AppError } from '../utils/errors';
import { authMiddleware } from '../middleware/auth';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const router = Router();

function setRefreshCookie(res: Response, refreshToken: string): void {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/auth',
  });
}

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest('Invalid input', parsed.error.format());
    }

    const result = await AuthService.register(parsed.data.email, parsed.data.password, parsed.data.name);
    setRefreshCookie(res, result.refreshToken);

    res.status(201).json({
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest('Invalid input', parsed.error.format());
    }

    const result = await AuthService.login(parsed.data.email, parsed.data.password);
    setRefreshCookie(res, result.refreshToken);

    res.json({
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/auth',
  });
  res.json({ message: 'Logged out successfully' });
});

router.post('/refresh', (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw AppError.unauthorized('Refresh token not provided');
    }

    const accessToken = AuthService.refreshAccessToken(refreshToken);
    res.json({ accessToken });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const user = await AuthService.getCurrentUser(userId);
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

export default router;
