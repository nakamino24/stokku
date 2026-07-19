import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authMiddleware } from '../../middleware/auth';
import { ReportsService } from './reports.service';

const router = Router();
router.use(authMiddleware);

router.get('/stock-value', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await ReportsService.stockValue(user.organizationId);
  res.json(result);
}));

router.get('/stock-movement', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await ReportsService.stockMovement(user.organizationId, req.query.startDate as string, req.query.endDate as string);
  res.json(result);
}));

router.get('/sales', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await ReportsService.sales(user.organizationId, req.query.startDate as string, req.query.endDate as string);
  res.json(result);
}));

router.get('/purchasing', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await ReportsService.purchasing(user.organizationId, req.query.startDate as string, req.query.endDate as string);
  res.json(result);
}));

router.get('/inventory-valuation', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await ReportsService.inventoryValuation(user.organizationId);
  res.json(result);
}));

router.get('/audit-log', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await ReportsService.auditLog(user.organizationId, req.query as any);
  res.json(result);
}));

export default router;
