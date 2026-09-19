import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler'
import { validate } from '../../middleware/validate'
import { authMiddleware } from '../../middleware/auth'
import { requirePermission } from '../../middleware/rbac'
import { CategoryService } from './categories.service'
import { createCategorySchema, updateCategorySchema } from './categories.schema'

const router = Router()

router.use(authMiddleware)

router.get(
  '/',
  requirePermission('category.read'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    const result = await CategoryService.list(user.organizationId)
    res.json(result)
  })
)

router.get(
  '/:id',
  requirePermission('category.read'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    const result = await CategoryService.getById(user.organizationId, req.params.id)
    res.json(result)
  })
)

router.post(
  '/',
  requirePermission('category.create'),
  validate({ body: createCategorySchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    const result = await CategoryService.create(user.organizationId, req.body)
    res.status(201).json(result)
  })
)

router.put(
  '/:id',
  requirePermission('category.update'),
  validate({ body: updateCategorySchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    const result = await CategoryService.update(user.organizationId, req.params.id, req.body)
    res.json(result)
  })
)

router.delete(
  '/:id',
  requirePermission('category.archive'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user
    await CategoryService.delete(user.organizationId, req.params.id)
    res.status(204).send()
  })
)

export default router
