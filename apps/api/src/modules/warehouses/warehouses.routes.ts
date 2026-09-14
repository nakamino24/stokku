import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler'
import { validate } from '../../middleware/validate'
import { authMiddleware } from '../../middleware/auth'
import { requirePermission } from '../../middleware/rbac'
import { WarehouseService } from './warehouses.service'
import {
  createWarehouseSchema,
  updateWarehouseSchema,
  createZoneSchema,
  createBinSchema,
} from './warehouses.schema'

const router = Router()

router.use(authMiddleware)

router.get(
  '/',
  requirePermission('warehouse.read'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    const result = await WarehouseService.list(user.organizationId, user.id)
    res.json(result)
  })
)

router.get(
  '/:id',
  requirePermission('warehouse.read'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    const result = await WarehouseService.getById(user.organizationId, user.id, req.params.id)
    res.json(result)
  })
)

router.post(
  '/',
  requirePermission('warehouse.create'),
  validate({ body: createWarehouseSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    const result = await WarehouseService.create(user.organizationId, user.id, req.body)
    res.status(201).json(result)
  })
)

router.put(
  '/:id',
  requirePermission('warehouse.update'),
  validate({ body: updateWarehouseSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    const result = await WarehouseService.update(user.organizationId, user.id, req.params.id, req.body)
    res.json(result)
  })
)

router.delete(
  '/:id',
  requirePermission('warehouse.archive'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    await WarehouseService.delete(user.organizationId, user.id, req.params.id)
    res.status(204).send()
  })
)

router.post(
  '/:id/zones',
  requirePermission('warehouse.update'),
  validate({ body: createZoneSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    const result = await WarehouseService.createZone(user.organizationId, user.id, req.params.id, req.body)
    res.status(201).json(result)
  })
)

router.post(
  '/zones/:zoneId/bins',
  requirePermission('warehouse.update'),
  validate({ body: createBinSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    const result = await WarehouseService.createBin(
      user.organizationId,
      user.id,
      req.params.zoneId,
      req.body
    )
    res.status(201).json(result)
  })
)

export default router
