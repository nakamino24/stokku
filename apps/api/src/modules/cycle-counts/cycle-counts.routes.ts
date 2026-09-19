import { Router, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { CycleCountService } from './cycle-counts.service';
import { approveCycleCountSchema, createCycleCountSchema, executeCycleCountSchema } from './cycle-counts.schema';
import { AuthRequest } from '../../utils/types';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('cycle_count.create'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await CycleCountService.list(user.organizationId, user.id, req.query as Record<string, unknown>);
  res.json(result);
}));

router.post('/', requirePermission('cycle_count.create'), validate({ body: createCycleCountSchema }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await CycleCountService.create(user.organizationId, user.id, req.body);
  res.status(201).json(result);
}));

router.post('/:id/execute', requirePermission('cycle_count.execute'), validate({ body: executeCycleCountSchema }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await CycleCountService.execute(user.organizationId, user.id, req.params.id, req.body);
  res.json(result);
}));

router.post('/:id/approve', requirePermission('cycle_count.approve'), validate({ body: approveCycleCountSchema }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await CycleCountService.approve(user.organizationId, user.id, req.params.id, req.body);
  res.json(result);
}));

export default router;
