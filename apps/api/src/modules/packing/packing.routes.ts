import { Router, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { PackingService } from './packing.service';
import { completePackSchema, packingExceptionSchema } from './packing.schema';
import { AuthRequest } from '../../utils/types';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('pack.execute'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await PackingService.list(user.organizationId, user.id, req.query as Record<string, unknown>);
  res.json(result);
}));

router.post('/:id/claim', requirePermission('pack.execute'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await PackingService.claim(user.organizationId, user.id, req.params.id);
  res.json(result);
}));

router.post('/:id/complete', requirePermission('pack.execute'), validate({ body: completePackSchema }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await PackingService.complete(user.organizationId, user.id, req.params.id, req.body);
  res.json(result);
}));

router.post('/:id/exception', requirePermission('pack.execute'), validate({ body: packingExceptionSchema }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await PackingService.exception(user.organizationId, user.id, req.params.id, req.body);
  res.json(result);
}));

export default router;
