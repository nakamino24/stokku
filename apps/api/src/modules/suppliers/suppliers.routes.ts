import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler'
import { validate } from '../../middleware/validate'
import { authMiddleware } from '../../middleware/auth'
import { requirePermission } from '../../middleware/rbac'
import { SupplierService } from './suppliers.service'
import { createSupplierSchema, updateSupplierSchema } from './suppliers.schema'

const router = Router()

router.use(authMiddleware)

router.get(
  '/',
  requirePermission('supplier.read'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    const result = await SupplierService.list(user.organizationId, req.query as any)
    res.json(result)
  })
)

router.get(
  '/:id',
  requirePermission('supplier.read'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    const result = await SupplierService.getById(user.organizationId, req.params.id)
    res.json(result)
  })
)

router.post(
  '/',
  requirePermission('supplier.create'),
  validate({ body: createSupplierSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    const result = await SupplierService.create(user.organizationId, req.body)
    res.status(201).json(result)
  })
)

router.put(
  '/:id',
  requirePermission('supplier.update'),
  validate({ body: updateSupplierSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    const result = await SupplierService.update(user.organizationId, req.params.id, req.body)
    res.json(result)
  })
)

router.delete(
  '/:id',
  requirePermission('supplier.archive'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    await SupplierService.delete(user.organizationId, req.params.id)
    res.status(204).send()
  })
)

export default router
