import { Request, Response, NextFunction } from 'express';
import { prisma, OrganizationRole } from '@stokku/database';
import { AppError } from '../utils/errors';

const ROLE_HIERARCHY: Record<OrganizationRole, number> = {
  OWNER: 100,
  ADMIN: 90,
  INVENTORY_MANAGER: 70,
  WAREHOUSE_STAFF: 50,
  CASHIER: 30,
  VIEWER: 10,
};

export function requireRole(minimumRole: OrganizationRole) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return next(AppError.unauthorized());

    const userLevel = ROLE_HIERARCHY[user.role as OrganizationRole] ?? 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole];

    if (userLevel < requiredLevel) {
      return next(AppError.forbidden('Insufficient permissions'));
    }

    next();
  };
}

export function requirePermission(permission: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user) return next(AppError.unauthorized());

      const roleLevel = ROLE_HIERARCHY[user.role as OrganizationRole] ?? 0;
      if (roleLevel >= ROLE_HIERARCHY.ADMIN) return next();

      const roles = await prisma.role.findMany({
        where: { organizationId: user.organizationId, slug: (user.role as string).toLowerCase() },
        include: { permissions: { where: { permission } } },
      });

      const hasPermission = roles.some(r => (r.permissions ?? []).length > 0);

      if (!hasPermission) {
        return next(AppError.forbidden(`Missing permission: ${permission}`));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
