import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { AuthService } from './auth.service';
import { registerSchema, loginSchema, refreshSchema, updateProfileSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schema';
import { AppError } from '../../utils/errors';

const router = Router();

router.post('/register', validate({ body: registerSchema }), asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.register(req.body);
  res.status(201).json(result);
}));

router.post('/login', validate({ body: loginSchema }), asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.login(req.body.email, req.body.password);
  res.json(result);
}));

router.post('/refresh', validate({ body: refreshSchema }), asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.refresh(req.body.refreshToken);
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
  res.json(result);
}));

router.post('/forgot-password', validate({ body: forgotPasswordSchema }), asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.requestPasswordReset(req.body.email);
  res.json(result);
}));

router.post('/reset-password', validate({ body: resetPasswordSchema }), asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.resetPassword(req.body.token, req.body.newPassword);
  res.json(result);
}));

export default router;
