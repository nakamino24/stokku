import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authMiddleware } from '../../middleware/auth';
import { DashboardService } from './dashboard.service';

const router = Router();
router.use(authMiddleware);

router.get('/summary', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await DashboardService.getSummary(user.organizationId);
  res.json(result);
}));

router.get('/low-stock', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await DashboardService.getLowStockAlerts(user.organizationId);
  res.json(result);
}));

export default router;
