import { Request, Response, NextFunction } from 'express';
import { prisma, OrganizationRole } from '@stokku/database';
import { AppError } from '../utils/errors';
import { AuthRequest } from '../utils/types';

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
    const user = (req as AuthRequest).user;
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
      await assertPermission(req, permission);
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requirePermissionFromRequest(resolve: (req: Request) => string | undefined) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const permission = resolve(req);
      if (!permission) return next(AppError.badRequest('Unsupported action'));
      await assertPermission(req, permission);
      next();
    } catch (err) {
      next(err);
    }
  };
}

async function assertPermission(req: Request, permission: string): Promise<void> {
  const user = (req as AuthRequest).user;
  if (!user) throw AppError.unauthorized();

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: user.organizationId,
        userId: user.id,
      },
    },
    include: {
      assignedRole: {
        include: { permissions: { where: { permission: { in: [permission, '*'] } } } },
      },
    },
  });
  const effectiveRole = membership?.role ?? (user.role as OrganizationRole);
  if (membership?.assignedRole?.permissions.length) return;
  if (effectiveRole === 'OWNER' || effectiveRole === 'ADMIN') return;

  const systemRole = await prisma.role.findFirst({
    where: {
      organizationId: user.organizationId,
      slug: effectiveRole.toLowerCase(),
      permissions: { some: { permission: { in: [permission, '*'] } } },
    },
  });
  if (!systemRole) throw AppError.forbidden(`Missing permission: ${permission}`);
}
