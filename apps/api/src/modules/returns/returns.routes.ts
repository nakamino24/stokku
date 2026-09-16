import { Router, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { ReturnsService } from './returns.service';
import { approveReturnSchema, completeReturnSchema, createReturnSchema } from './returns.schema';
import { AuthRequest } from '../../utils/types';
import { requireIdempotencyKey } from '../../utils/idempotency';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('inventory.read'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await ReturnsService.list(user.organizationId, user.id, req.query as Record<string, unknown>);
  res.json(result);
}));

router.post('/', requirePermission('inventory.adjust.approve'), validate({ body: createReturnSchema }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await ReturnsService.create(user.organizationId, user.id, req.body);
  res.status(201).json(result);
}));

router.post('/:id/approve', requirePermission('inventory.adjust.approve'), validate({ body: approveReturnSchema }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await ReturnsService.approve(user.organizationId, user.id, req.params.id, req.body);
  res.json(result);
}));

router.post('/:id/complete', requirePermission('inventory.adjust.approve'), validate({ body: completeReturnSchema }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await ReturnsService.complete(user.organizationId, user.id, req.params.id, {
    ...req.body,
    idempotencyKey: requireIdempotencyKey(req),
  });
  res.json(result);
}));

export default router;
