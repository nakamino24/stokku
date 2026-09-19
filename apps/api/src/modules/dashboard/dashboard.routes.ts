import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler'
import { authMiddleware } from '../../middleware/auth'
import { requirePermission } from '../../middleware/rbac'
import { DashboardService } from './dashboard.service'

const router = Router()
router.use(authMiddleware)

router.get(
  '/',
  requirePermission('dashboard.read'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    const result = await DashboardService.getSummary(user.organizationId, user.id)
    res.json(result)
  })
)

router.get(
  '/summary',
  requirePermission('dashboard.read'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    const result = await DashboardService.getSummary(user.organizationId, user.id)
    res.json(result)
  })
)

router.get(
  '/low-stock',
  requirePermission('dashboard.read'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    const result = await DashboardService.getLowStockAlerts(user.organizationId, user.id)
    res.json(result)
  })
)

export default router
