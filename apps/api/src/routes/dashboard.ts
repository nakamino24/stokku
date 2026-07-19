import { Router, Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboardService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const stats = await DashboardService.getStats(userId);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

router.get('/recent-projects', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const projects = await DashboardService.getRecentProjects(userId);
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

router.get('/inventory-stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const stats = await DashboardService.getInventoryStats(userId);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

export default router;
