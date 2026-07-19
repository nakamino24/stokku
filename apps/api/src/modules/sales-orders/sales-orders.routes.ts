import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { SalesOrderService } from './sales-orders.service';
import { createSalesOrderSchema, updateSalesOrderStatusSchema } from './sales-orders.schema';

const router = Router();

router.use(authMiddleware, requireRole('INVENTORY_MANAGER'));

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await SalesOrderService.list(user.organizationId, req.query as any);
  res.json(result);
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await SalesOrderService.getById(user.organizationId, req.params.id);
  res.json(result);
}));

router.post('/', validate({ body: createSalesOrderSchema }), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await SalesOrderService.create(user.organizationId, user.id, req.body);
  res.status(201).json(result);
}));

router.patch('/:id/status', validate({ body: updateSalesOrderStatusSchema }), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await SalesOrderService.updateStatus(user.organizationId, user.id, req.params.id, req.body.status);
  res.json(result);
}));

export default router;
