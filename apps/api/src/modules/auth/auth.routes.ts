import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { passwordResetLimiter } from '../../middleware/security';
import { AuthService } from './auth.service';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schema';
import { clearRefreshCookie, REFRESH_COOKIE_NAME, setRefreshCookie } from './auth.cookies';

const router = Router();

router.post('/register', validate({ body: registerSchema }), asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.register(req.body);
  setRefreshCookie(res, result.refreshToken);
  const { refreshToken: _refreshToken, ...response } = result;
  res.status(201).json(response);
}));

router.post('/login', validate({ body: loginSchema }), asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.login(req.body.email, req.body.password);
  setRefreshCookie(res, result.refreshToken);
  const { refreshToken: _refreshToken, ...response } = result;
  res.json(response);
}));

router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!refreshToken) {
    clearRefreshCookie(res);
    res.status(401).json({ error: 'Refresh session is required', code: 'UNAUTHORIZED' });
    return;
  }

  const result = await AuthService.refresh(refreshToken);
  setRefreshCookie(res, result.refreshToken);
  res.json({ accessToken: result.accessToken });
}));

router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  const result = await AuthService.logout(refreshToken);
  clearRefreshCookie(res);
  res.json(result);
}));

router.get('/me', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const profile = await AuthService.getProfile(user.id);
  res.json(profile);
}));

router.put('/me', authMiddleware, validate({ body: updateProfileSchema }), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await AuthService.updateProfile(user.id, req.body);
  res.json(result);
}));

router.post('/change-password', authMiddleware, validate({ body: changePasswordSchema }), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await AuthService.changePassword(user.id, req.body.currentPassword, req.body.newPassword);
  clearRefreshCookie(res);
  res.json(result);
}));

router.post('/forgot-password', passwordResetLimiter, validate({ body: forgotPasswordSchema }), asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.requestPasswordReset(req.body.email);
  res.json(result);
}));

router.post('/reset-password', passwordResetLimiter, validate({ body: resetPasswordSchema }), asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.resetPassword(req.body.token, req.body.newPassword);
  clearRefreshCookie(res);
  res.json(result);
}));

export default router;
