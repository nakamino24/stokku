import { Router, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { ShipmentService } from './shipment.service';
import { postShipmentSchema, voidShipmentSchema } from './shipment.schema';
import { AuthRequest } from '../../utils/types';
import { requireIdempotencyKey } from '../../utils/idempotency';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('shipment.post'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await ShipmentService.list(user.organizationId, user.id, req.query as Record<string, unknown>);
  res.json(result);
}));

router.post('/:id/post', requirePermission('shipment.post'), validate({ body: postShipmentSchema }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await ShipmentService.post(user.organizationId, user.id, req.params.id, {
    ...req.body,
    idempotencyKey: requireIdempotencyKey(req),
  });
  res.json(result);
}));

router.post('/:id/void', requirePermission('shipment.post'), validate({ body: voidShipmentSchema }), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await ShipmentService.voidShipment(user.organizationId, user.id, req.params.id, {
    ...req.body,
    idempotencyKey: requireIdempotencyKey(req),
  });
  res.json(result);
}));

export default router;
