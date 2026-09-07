import { Router, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { requirePermission, requirePermissionFromRequest } from '../../middleware/rbac';
import { requireIdempotencyKey } from '../../utils/idempotency';
import { PurchaseOrderService } from './purchase-orders.service';
import { createPurchaseOrderSchema, updatePurchaseOrderStatusSchema, receivePurchaseOrderSchema } from './purchase-orders.schema';
import { AuthRequest } from '../../utils/types';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('po.read'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await PurchaseOrderService.list(user.organizationId, req.query as Record<string, unknown>);
  res.json(result);
}));

router.get('/:id', requirePermission('po.read'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await PurchaseOrderService.getById(user.organizationId, req.params.id);
  res.json(result);
}));

router.post('/', requirePermission('po.create'), validate({ body: createPurchaseOrderSchema }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await PurchaseOrderService.create(user.organizationId, user.id, req.body);
  res.status(201).json(result);
}));

const statusPermission: Record<string, string> = {
  PENDING_APPROVAL: 'po.submit',
  APPROVED: 'po.approve',
  SENT: 'po.send',
  CANCELLED: 'po.cancel',
};

router.patch('/:id/status', validate({ body: updatePurchaseOrderStatusSchema }), requirePermissionFromRequest((req) => statusPermission[req.body.status]), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await PurchaseOrderService.updateStatus(user.organizationId, user.id, req.params.id, req.body.status);
  res.json(result);
}));

router.post('/:id/receive', requirePermission('receipt.post'), validate({ body: receivePurchaseOrderSchema }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await PurchaseOrderService.receive(user.organizationId, user.id, req.params.id, {
    ...req.body,
    idempotencyKey: requireIdempotencyKey(req),
  });
  res.status(201).json(result);
}));

export default router;
