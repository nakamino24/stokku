import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { SettingsService } from './settings.service';
import { updateOrganizationSchema } from './settings.schema';

const router = Router();
router.use(authMiddleware, requireRole('ADMIN'));

router.get('/organization', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await SettingsService.getOrganization(user.organizationId);
  res.json(result);
}));

router.put('/organization', validate({ body: updateOrganizationSchema }), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await SettingsService.updateOrganization(user.organizationId, req.body);
  res.json(result);
}));

export default router;
