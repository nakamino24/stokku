import { Request, Response, NextFunction } from 'express';
import { prisma } from '@stokku/database';

export function auditLog(action: string, entityType: string, getEntityId?: (req: Request) => string | undefined) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      const user = (req as any).user;
      if (user && res.statusCode < 400) {
        const entityId = getEntityId ? getEntityId(req) : (req.params.id || body?.id);
        prisma.auditLog.create({
          data: {
            organizationId: user.organizationId,
            userId: user.id,
            action,
            entityType,
            entityId,
            ipAddress: req.ip,
            userAgent: req.get('user-agent') || '',
          },
        }).catch(() => {});
      }
      return originalJson(body);
    };
    next();
  };
}
