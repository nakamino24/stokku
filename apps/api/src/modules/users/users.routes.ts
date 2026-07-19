import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { UsersService } from './users.service';
import { updateUserRoleSchema } from './users.schema';

const router = Router();
router.use(authMiddleware, requireRole('ADMIN'));

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await UsersService.list(user.organizationId, req.query as any);
  res.json(result);
}));

router.patch('/:id/role', validate({ body: updateUserRoleSchema }), asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await UsersService.updateRole(user.organizationId, req.params.id, req.body.role);
  res.json(result);
}));

router.patch('/:id/deactivate', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await UsersService.deactivate(user.organizationId, req.params.id);
  res.json(result);
}));

export default router;
