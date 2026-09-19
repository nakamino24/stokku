import { Router, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { ReconciliationService } from './reconciliation.service';
import { createReconciliationRunSchema, resolveDiscrepancySchema } from './reconciliation.schema';
import { AuthRequest } from '../../utils/types';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('inventory.reconcile'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await ReconciliationService.list(user.organizationId, user.id, req.query as Record<string, unknown>);
  res.json(result);
}));

router.post('/', requirePermission('inventory.reconcile'), validate({ body: createReconciliationRunSchema }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await ReconciliationService.create(user.organizationId, user.id, req.body);
  res.status(201).json(result);
}));

router.get('/:id', requirePermission('inventory.reconcile'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await ReconciliationService.getById(user.organizationId, user.id, req.params.id);
  res.json(result);
}));

router.post('/:id/start', requirePermission('inventory.reconcile'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await ReconciliationService.start(user.organizationId, user.id, req.params.id);
  res.json(result);
}));

router.get('/:id/discrepancies', requirePermission('inventory.reconcile'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await ReconciliationService.getDiscrepancies(user.organizationId, user.id, req.params.id, req.query as Record<string, unknown>);
  res.json(result);
}));

router.post('/:id/discrepancies/:discrepancyId/resolve', requirePermission('inventory.reconcile'), validate({ body: resolveDiscrepancySchema }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await ReconciliationService.resolveDiscrepancy(user.organizationId, user.id, req.params.id, req.params.discrepancyId, req.body);
  res.json(result);
}));

router.post('/:id/complete', requirePermission('inventory.reconcile'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await ReconciliationService.complete(user.organizationId, user.id, req.params.id);
  res.json(result);
}));

router.post('/:id/cancel', requirePermission('inventory.reconcile'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await ReconciliationService.cancel(user.organizationId, user.id, req.params.id);
  res.json(result);
}));

export default router;