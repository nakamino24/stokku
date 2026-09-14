import { Router, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { PutawayService } from './putaway.service';
import { completePutawaySchema, putawayExceptionSchema } from './putaway.schema';
import { AuthRequest } from '../../utils/types';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('putaway.read'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await PutawayService.list(user.organizationId, user.id, req.query as Record<string, unknown>);
  res.json(result);
}));

router.post('/:id/claim', requirePermission('putaway.claim'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await PutawayService.claim(user.organizationId, user.id, req.params.id);
  res.json(result);
}));

router.post('/:id/complete', requirePermission('putaway.complete'), validate({ body: completePutawaySchema }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await PutawayService.complete(user.organizationId, user.id, req.params.id, req.body);
  res.json(result);
}));

router.post('/:id/exception', requirePermission('putaway.exception'), validate({ body: putawayExceptionSchema }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await PutawayService.exception(user.organizationId, user.id, req.params.id, req.body);
  res.json(result);
}));

export default router;
