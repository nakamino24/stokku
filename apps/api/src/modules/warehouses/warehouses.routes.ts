import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { WarehouseService } from './warehouses.service';
import { createWarehouseSchema, updateWarehouseSchema, createZoneSchema, createBinSchema } from './warehouses.schema';

const router = Router();

router.use(authMiddleware, requireRole('INVENTORY_MANAGER'));

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await WarehouseService.list(user.organizationId);
  res.json(result);
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await WarehouseService.getById(user.organizationId, req.params.id);
  res.json(result);
}));

router.post('/', validate({ body: createWarehouseSchema }), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await WarehouseService.create(user.organizationId, req.body);
  res.status(201).json(result);
}));

router.put('/:id', validate({ body: updateWarehouseSchema }), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await WarehouseService.update(user.organizationId, req.params.id, req.body);
  res.json(result);
}));

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  await WarehouseService.delete(user.organizationId, req.params.id);
  res.status(204).send();
}));

router.post('/:id/zones', validate({ body: createZoneSchema }), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await WarehouseService.createZone(user.organizationId, req.params.id, req.body);
  res.status(201).json(result);
}));

router.post('/zones/:zoneId/bins', validate({ body: createBinSchema }), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await WarehouseService.createBin(user.organizationId, req.params.zoneId, req.body);
  res.status(201).json(result);
}));

export default router;
