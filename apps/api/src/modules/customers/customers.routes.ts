import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { CustomerService } from './customers.service';
import { createCustomerSchema, updateCustomerSchema } from './customers.schema';

const router = Router();

router.use(authMiddleware, requireRole('INVENTORY_MANAGER'));

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await CustomerService.list(user.organizationId, req.query as any);
  res.json(result);
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await CustomerService.getById(user.organizationId, req.params.id);
  res.json(result);
}));

router.post('/', validate({ body: createCustomerSchema }), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await CustomerService.create(user.organizationId, req.body);
  res.status(201).json(result);
}));

router.put('/:id', validate({ body: updateCustomerSchema }), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await CustomerService.update(user.organizationId, req.params.id, req.body);
  res.json(result);
}));

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  await CustomerService.delete(user.organizationId, req.params.id);
  res.status(204).send();
}));

export default router;
