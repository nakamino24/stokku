import { Router, Request, Response, NextFunction } from 'express';
import { WarehouseService } from '../services/warehouseService';
import { authMiddleware } from '../middleware/auth';
import { resolveWorkspaceId } from '../utils/workspace';
import { AppError } from '../utils/errors';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

const createSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(20).regex(/^[A-Z0-9_-]+$/),
  description: z.string().optional(),
  address: z.string().optional(),
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = await resolveWorkspaceId((req as any).user.userId);
    const warehouses = await WarehouseService.list(workspaceId);
    res.json({ warehouses });
  } catch (error) { next(error); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = await resolveWorkspaceId((req as any).user.userId);
    const id = req.params.id as string;
    const warehouse = await WarehouseService.getById(id, workspaceId);
    res.json(warehouse);
  } catch (error) { next(error); }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = await resolveWorkspaceId((req as any).user.userId);
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) throw AppError.badRequest('Invalid input', parsed.error.format());
    const warehouse = await WarehouseService.create({ workspaceId, ...parsed.data });
    res.status(201).json(warehouse);
  } catch (error) { next(error); }
});

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = await resolveWorkspaceId((req as any).user.userId);
    const id = req.params.id as string;
    const { name, code, description, address, isActive } = req.body;
    const warehouse = await WarehouseService.update(id, workspaceId, { name, code, description, address, isActive });
    res.json(warehouse);
  } catch (error) { next(error); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = await resolveWorkspaceId((req as any).user.userId);
    const id = req.params.id as string;
    await WarehouseService.delete(id, workspaceId);
    res.json({ message: 'Warehouse deleted' });
  } catch (error) { next(error); }
});

export default router;
