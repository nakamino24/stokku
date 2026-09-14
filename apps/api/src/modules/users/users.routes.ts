import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler'
import { validate } from '../../middleware/validate'
import { authMiddleware } from '../../middleware/auth'
import { requirePermission } from '../../middleware/rbac'
import { UsersService } from './users.service'
import { replaceWarehouseAssignmentsSchema, updateUserRoleSchema } from './users.schema'
import { WarehouseAssignmentsService } from './warehouse-assignments.service'

const router = Router()
router.use(authMiddleware, requirePermission('user.manage'))

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    const result = await UsersService.list(user.organizationId, req.query as any)
    res.json(result)
  })
)

router.patch(
  '/:id/role',
  validate({ body: updateUserRoleSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    const result = await UsersService.updateRole(
      user.organizationId,
      user.id,
      req.params.id,
      req.body.role
    )
    res.json(result)
  })
)

router.patch(
  '/:id/deactivate',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    const result = await UsersService.deactivate(user.organizationId, user.id, req.params.id)
    res.json(result)
  })
)

router.get(
  '/:id/warehouses',
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    const result = await WarehouseAssignmentsService.list(user.organizationId, user.id, req.params.id)
    res.json(result)
  })
)

router.put(
  '/:id/warehouses',
  validate({ body: replaceWarehouseAssignmentsSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    const result = await WarehouseAssignmentsService.replace(
      user.organizationId,
      user.id,
      req.params.id,
      req.body.warehouseIds,
    )
    res.json(result)
  })
)

export default router
