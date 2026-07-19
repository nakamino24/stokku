import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { PurchaseOrderService } from './purchase-orders.service';
import { createPurchaseOrderSchema, updatePurchaseOrderStatusSchema, receivePurchaseOrderSchema } from './purchase-orders.schema';

const router = Router();

router.use(authMiddleware, requireRole('INVENTORY_MANAGER'));

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await PurchaseOrderService.list(user.organizationId, req.query as any);
  res.json(result);
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await PurchaseOrderService.getById(user.organizationId, req.params.id);
  res.json(result);
}));

router.post('/', validate({ body: createPurchaseOrderSchema }), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await PurchaseOrderService.create(user.organizationId, user.id, req.body);
  res.status(201).json(result);
}));

router.patch('/:id/status', validate({ body: updatePurchaseOrderStatusSchema }), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await PurchaseOrderService.updateStatus(user.organizationId, user.id, req.params.id, req.body.status);
  res.json(result);
}));

router.post('/:id/receive', validate({ body: receivePurchaseOrderSchema }), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await PurchaseOrderService.receive(user.organizationId, user.id, req.body.warehouseId, req.params.id, req.body.items);
  res.json(result);
}));

export default router;
