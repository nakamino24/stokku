import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { RolesService } from './roles.service';
import { createRoleSchema, updateRoleSchema } from './roles.schema';

const router = Router();
router.use(authMiddleware);

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await RolesService.list(user.organizationId);
  res.json(result);
}));

router.post('/', validate({ body: createRoleSchema }), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await RolesService.create(user.organizationId, req.body);
  res.status(201).json(result);
}));

router.put('/:id', validate({ body: updateRoleSchema }), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await RolesService.update(user.organizationId, req.params.id, req.body);
  res.json(result);
}));

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  await RolesService.delete(user.organizationId, req.params.id);
  res.status(204).send();
}));

export default router;
