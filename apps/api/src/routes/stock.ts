import { Router, Request, Response, NextFunction } from 'express';
import { StockService } from '../services/stockService';
import { authMiddleware } from '../middleware/auth';
import { resolveWorkspaceId } from '../utils/workspace';
import { AppError } from '../utils/errors';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

const adjustSchema = z.object({
  variantId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantity: z.number().int(),
  type: z.enum(['receipt', 'shipment', 'adjustment', 'transfer', 'count', 'scrap']),
  reference: z.string().optional(),
  reason: z.string().optional(),
});

router.get('/levels', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = await resolveWorkspaceId((req as any).user.userId);
    const warehouseId = typeof req.query.warehouseId === 'string' ? req.query.warehouseId : undefined;
    const variantId = typeof req.query.variantId === 'string' ? req.query.variantId : undefined;
    const lowStock = req.query.lowStock === 'true';

    const levels = await StockService.getLevels(workspaceId, { warehouseId, variantId, lowStock });
    res.json({ levels });
  } catch (error) { next(error); }
});

router.post('/adjust', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = await resolveWorkspaceId((req as any).user.userId);
    const userId = (req as any).user.userId;
    const parsed = adjustSchema.safeParse(req.body);
    if (!parsed.success) throw AppError.badRequest('Invalid input', parsed.error.format());

    const level = await StockService.adjust({ workspaceId, userId, ...parsed.data });
    res.json(level);
  } catch (error) { next(error); }
});

router.get('/movements', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = await resolveWorkspaceId((req as any).user.userId);
    const variantId = typeof req.query.variantId === 'string' ? req.query.variantId : undefined;
    const warehouseId = typeof req.query.warehouseId === 'string' ? req.query.warehouseId : undefined;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));

    const result = await StockService.getMovements(workspaceId, {
      variantId, warehouseId, skip: (page - 1) * limit, take: limit,
    });

    res.json({
      movements: result.data,
      pagination: { page, limit, totalPages: Math.ceil(result.count / limit), totalItems: result.count },
    });
  } catch (error) { next(error); }
});

export default router;
