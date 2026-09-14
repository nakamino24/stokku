import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler'
import { authMiddleware } from '../../middleware/auth'
import { ReportsService } from './reports.service'
import { requirePermission } from '../../middleware/rbac'

const router = Router()
router.use(authMiddleware)

router.get(
  '/stock-value',
  requirePermission('report.inventory.read'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    const result = await ReportsService.stockValue(user.organizationId, user.id)
    res.json(result)
  })
)

router.get(
  '/stock-movement',
  requirePermission('report.inventory.read'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    const result = await ReportsService.stockMovement(
      user.organizationId,
      user.id,
      req.query.startDate as string,
      req.query.endDate as string
    )
    res.json(result)
  })
)

router.get(
  '/sales',
  requirePermission('report.sales.read'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    const result = await ReportsService.sales(
      user.organizationId,
      user.id,
      req.query.startDate as string,
      req.query.endDate as string
    )
    res.json(result)
  })
)

router.get(
  '/purchasing',
  requirePermission('report.purchasing.read'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    const result = await ReportsService.purchasing(
      user.organizationId,
      user.id,
      req.query.startDate as string,
      req.query.endDate as string
    )
    res.json(result)
  })
)

router.get(
  '/inventory-valuation',
  requirePermission('report.inventory.read'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    const result = await ReportsService.inventoryValuation(user.organizationId, user.id)
    res.json(result)
  })
)

router.get(
  '/audit-log',
  requirePermission('audit.read'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    const result = await ReportsService.auditLog(user.organizationId, req.query as any)
    res.json(result)
  })
)

export default router
