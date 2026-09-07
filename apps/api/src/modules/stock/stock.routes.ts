import { Router, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { requireIdempotencyKey } from '../../utils/idempotency';
import { StockService } from './stock.service';
import { adjustStockSchema, reverseStockMovementSchema, transferStockSchema } from './stock.schema';
import { AuthRequest } from '../../utils/types';

const router = Router();
router.use(authMiddleware);

router.get('/', requirePermission('inventory.read'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await StockService.list(user.organizationId, req.query as Record<string, unknown>);
  res.json(result);
}));

router.get('/movements', requirePermission('inventory.read'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await StockService.getMovements(user.organizationId, req.query as Record<string, unknown>);
  res.json(result);
}));

router.get('/low-stock', requirePermission('inventory.read'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await StockService.list(user.organizationId, { ...req.query, lowStock: 'true' });
  res.json(result);
}));

router.get('/reconciliation', requirePermission('inventory.reconcile'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await StockService.reconcile(user.organizationId);
  res.json(result);
}));

router.post('/adjust', requirePermission('inventory.adjust.approve'), validate({ body: adjustStockSchema }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await StockService.adjust(user.organizationId, user.id, {
    ...req.body,
    idempotencyKey: requireIdempotencyKey(req),
  });
  res.json(result);
}));

router.post('/movements/:id/reverse', requirePermission('inventory.adjust.approve'), validate({ body: reverseStockMovementSchema }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await StockService.reverseAdjustment(user.organizationId, user.id, req.params.id, {
    ...req.body,
    idempotencyKey: requireIdempotencyKey(req),
  });
  res.json(result);
}));

router.post('/transfer', requirePermission('inventory.transfer.dispatch'), validate({ body: transferStockSchema }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await StockService.transfer(user.organizationId, user.id, {
    ...req.body,
    idempotencyKey: requireIdempotencyKey(req),
  });
  res.json(result);
}));

export default router;
