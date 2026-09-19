import { Router, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { PickingService } from './picking.service';
import { confirmPickSchema, shortPickSchema } from './picking.schema';
import { AuthRequest } from '../../utils/types';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('pick.execute'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await PickingService.list(user.organizationId, user.id, req.query as Record<string, unknown>);
  res.json(result);
}));

router.post('/:id/claim', requirePermission('pick.execute'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await PickingService.claim(user.organizationId, user.id, req.params.id);
  res.json(result);
}));

router.post('/:id/confirm', requirePermission('pick.execute'), validate({ body: confirmPickSchema }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await PickingService.confirm(user.organizationId, user.id, req.params.id, req.body);
  res.json(result);
}));

router.post('/:id/short', requirePermission('pick.execute'), validate({ body: shortPickSchema }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await PickingService.shortPick(user.organizationId, user.id, req.params.id, req.body);
  res.json(result);
}));

export default router;
