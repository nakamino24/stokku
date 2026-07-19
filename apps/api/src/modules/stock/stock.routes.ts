import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { StockService } from './stock.service';
import { adjustStockSchema, transferStockSchema } from './stock.schema';

const router = Router();
router.use(authMiddleware, requireRole('INVENTORY_MANAGER'));

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await StockService.list(user.organizationId, req.query as any);
  res.json(result);
}));

router.get('/movements', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await StockService.getMovements(user.organizationId, req.query as any);
  res.json(result);
}));

router.get('/low-stock', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await StockService.list(user.organizationId, { ...req.query as any, lowStock: 'true' });
  res.json(result);
}));

router.post('/adjust', validate({ body: adjustStockSchema }), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await StockService.adjust(user.organizationId, user.id, req.body);
  res.json(result);
}));

router.post('/transfer', validate({ body: transferStockSchema }), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await StockService.transfer(user.organizationId, user.id, req.body);
  res.json(result);
}));

export default router;
