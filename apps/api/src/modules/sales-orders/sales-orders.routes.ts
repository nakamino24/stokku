import { Router, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { requirePermission, requirePermissionFromRequest } from '../../middleware/rbac';
import { SalesOrderService } from './sales-orders.service';
import { createSalesOrderSchema, updateSalesOrderStatusSchema } from './sales-orders.schema';
import { AuthRequest } from '../../utils/types';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('so.read'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await SalesOrderService.list(user.organizationId, req.query as Record<string, unknown>);
  res.json(result);
}));

router.get('/:id', requirePermission('so.read'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await SalesOrderService.getById(user.organizationId, req.params.id);
  res.json(result);
}));

router.post('/', requirePermission('so.create'), validate({ body: createSalesOrderSchema }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await SalesOrderService.create(user.organizationId, user.id, req.body);
  res.status(201).json(result);
}));

const statusPermission: Record<string, string> = {
  CONFIRMED: 'so.confirm',
  ALLOCATED: 'so.confirm',
  PICKING: 'pick.execute',
  PICKED: 'pick.execute',
  PACKED: 'pack.execute',
  SHIPPED: 'shipment.post',
  DELIVERED: 'shipment.post',
  CLOSED: 'so.confirm',
  CANCELLED: 'so.cancel',
  RETURNED: 'shipment.post',
};

router.patch(
  '/:id/status',
  validate({ body: updateSalesOrderStatusSchema }),
  requirePermissionFromRequest((req) => statusPermission[req.body.status]),
  asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await SalesOrderService.updateStatus(user.organizationId, user.id, req.params.id, req.body.status);
  res.json(result);
  }),
);

export default router;
