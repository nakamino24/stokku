import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { ProductService } from './products.service';
import { createProductSchema, updateProductSchema } from './products.schema';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('product.read'), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await ProductService.list(user.organizationId, req.query as any);
  res.json(result);
}));

router.get('/:id', requirePermission('product.read'), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await ProductService.getById(user.organizationId, req.params.id);
  res.json(result);
}));

router.post('/', requirePermission('product.create'), validate({ body: createProductSchema }), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await ProductService.create(user.organizationId, user.id, req.body);
  res.status(201).json(result);
}));

router.put('/:id', requirePermission('product.update'), validate({ body: updateProductSchema }), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await ProductService.update(user.organizationId, user.id, req.params.id, req.body);
  res.json(result);
}));

router.delete('/:id', requirePermission('product.archive'), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  await ProductService.delete(user.organizationId, user.id, req.params.id);
  res.status(204).send();
}));

export default router;
