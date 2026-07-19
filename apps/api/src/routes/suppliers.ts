import { Router, Request, Response, NextFunction } from 'express';
import { SupplierService } from '../services/supplierService';
import { authMiddleware } from '../middleware/auth';
import { resolveWorkspaceId } from '../utils/workspace';
import { AppError } from '../utils/errors';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware);

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  paymentTerms: z.string().optional(),
  currency: z.string().optional(),
  notes: z.string().optional(),
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = await resolveWorkspaceId((req as any).user.userId);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;

    const result = await SupplierService.list(workspaceId, {
      skip: (page - 1) * limit,
      take: limit,
      search,
    });

    res.json({
      suppliers: result.data,
      pagination: { page, limit, totalPages: Math.ceil(result.count / limit), totalItems: result.count },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = await resolveWorkspaceId((req as any).user.userId);
    const id = req.params.id as string;
    const supplier = await SupplierService.getById(id, workspaceId);
    res.json(supplier);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = await resolveWorkspaceId((req as any).user.userId);
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) throw AppError.badRequest('Invalid input', parsed.error.format());

    const supplier = await SupplierService.create({ workspaceId, ...parsed.data });
    res.status(201).json(supplier);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = await resolveWorkspaceId((req as any).user.userId);
    const id = req.params.id as string;
    const { name, email, phone, address, paymentTerms, currency, status, notes } = req.body;

    const supplier = await SupplierService.update(id, workspaceId, {
      name, email, phone, address, paymentTerms, currency, status, notes,
    });

    res.json(supplier);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = await resolveWorkspaceId((req as any).user.userId);
    const id = req.params.id as string;
    await SupplierService.delete(id, workspaceId);
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
