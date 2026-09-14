import { Request, Response, NextFunction } from 'express';
import { authorize } from '@stokku/domain';
import { authorizationRequestSchema } from '@stokku/validation';
import { AppError } from '../utils/errors';
import { AuthRequest } from '../utils/types';
import { buildAuthorizationContext, warehouseExists } from './prisma-authorization-adapter';
import { mapDenyReasonToHttpError } from './authorization-mapper';
import { logAuthorizationDecision, extractAuditContext } from './authorization-audit';

/**
 * HTTP adapter for target authorization parity probe.
 * 
 * Route: POST /api/v1/_parity/authorization/check
 * Enabled only when ENABLE_TARGET_AUTHORIZATION_ADAPTER=true
 * 
 * Per ADR-0017:
 * - Uses reference authMiddleware for identity (req.user must exist)
 * - Adapts Prisma to target AuthorizationContext
 * - Calls target authorize() from @stokku/domain
 * - Returns allow/deny with AppError envelope
 * - Logs both allow and deny outcomes (fire-and-forget)
 */
export async function checkAuthorizationHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      throw new AppError(401, 'Authentication required', 'UNAUTHENTICATED');
    }

    // Validate request body
    const validationResult = authorizationRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(400, 'Invalid request', 'VALIDATION_FAILED', {
        errors: validationResult.error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const { organizationId, permission, warehouseId } = validationResult.data;

    // Check warehouse existence for 404 vs 403 distinction
    if (warehouseId) {
      const exists = await warehouseExists(organizationId, warehouseId);
      if (!exists) {
        throw AppError.notFound('Warehouse not found');
      }
    }

    // Build target AuthorizationContext from Prisma
    const context = await buildAuthorizationContext({
      userId: user.id,
      organizationId,
      sessionId: user.sessionId,
    });

    if (!context) {
      throw AppError.forbidden('Organization membership required');
    }

    // Call target authorization decision
    const now = new Date();
    const decision = authorize(
      context,
      { organizationId, permission, warehouseId },
      now
    );

    const auditContext = extractAuditContext(req);
    const requestId = req.headers['x-request-id'] as string | string[] | undefined;
    const requestIdStr = Array.isArray(requestId) ? requestId[0] : requestId ?? 'unknown';

    if (decision.outcome === 'allow') {
      // Log allow outcome
      logAuthorizationDecision({
        requestId: requestIdStr,
        userId: user.id,
        organizationId: context.membership!.organizationId,
        warehouseId,
        permission,
        outcome: 'allow',
        denyReason: undefined,
        ...auditContext,
      });

      res.json({
        allowed: true,
        requestId: requestIdStr,
      });
    } else {
      // Log deny outcome
      logAuthorizationDecision({
        requestId: requestIdStr,
        userId: user.id,
        organizationId: context.membership?.organizationId || organizationId,
        warehouseId,
        permission,
        outcome: 'deny',
        denyReason: decision.reason,
        ...auditContext,
      });

      // Map deny reason to HTTP error
      const httpError = mapDenyReasonToHttpError(decision.reason);
      throw new AppError(httpError.statusCode, httpError.message, httpError.code);
    }
  } catch (error) {
    next(error);
  }
}
