import { Request, Response, NextFunction } from 'express'
import { prisma, OrganizationRole } from '@stokku/database'
import { AppError } from '../utils/errors'
import { AuthRequest } from '../utils/types'

const ROLE_HIERARCHY: Record<OrganizationRole, number> = {
  OWNER: 100,
  ADMIN: 90,
  INVENTORY_MANAGER: 70,
  WAREHOUSE_STAFF: 50,
  CASHIER: 30,
  VIEWER: 10,
}

export function roleLevel(role: OrganizationRole | string | undefined): number {
  return role ? ROLE_HIERARCHY[role as OrganizationRole] ?? 0 : 0
}

export function canAssignRole(
  actorRole: OrganizationRole | string | undefined,
  targetRole: OrganizationRole
): boolean {
  const actorLevel = roleLevel(actorRole)
  const targetLevel = roleLevel(targetRole)

  // Owner is a protected organization invariant. It is not an ordinary
  // role-management operation and cannot be granted by an admin.
  if (targetRole === 'OWNER') return actorRole === 'OWNER'
  return actorRole === 'OWNER' || actorLevel > targetLevel
}

export async function getCurrentMembership(user: AuthRequest['user']) {
  if (!user) return null
  return prisma.organizationMember.findFirst({
    where: {
      organizationId: user.organizationId,
      userId: user.id,
      user: { isActive: true, emailVerified: true },
    },
    select: { role: true, roleId: true },
  })
}

export function requireRole(minimumRole: OrganizationRole) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthRequest).user
      if (!user) throw AppError.unauthorized()
      const membership = await getCurrentMembership(user)
      if (!membership || roleLevel(membership.role) < ROLE_HIERARCHY[minimumRole]) {
        throw AppError.forbidden('Insufficient permissions')
      }
      next()
    } catch (err) {
      next(err)
    }
  }
}

export function requirePermission(permission: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await assertPermission(req, permission)
      next()
    } catch (err) {
      next(err)
    }
  }
}

export function requirePermissionFromRequest(resolve: (req: Request) => string | undefined) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const permission = resolve(req)
      if (!permission) return next(AppError.badRequest('Unsupported action'))
      await assertPermission(req, permission)
      next()
    } catch (err) {
      next(err)
    }
  }
}

async function assertPermission(req: Request, permission: string): Promise<void> {
  const user = (req as AuthRequest).user
  if (!user) throw AppError.unauthorized()

  const membership = await currentMembership(user, permission)
  if (!membership) throw AppError.forbidden('Organization membership required')

  const effectiveRole = membership.role as OrganizationRole
  if (
    (
      membership.assignedRole as { permissions?: Array<{ permission: string }> } | null
    )?.permissions?.some(
      ({ permission: assignedPermission }) =>
        assignedPermission === permission || assignedPermission === '*'
    )
  )
    return

  const systemRole = await prisma.role.findFirst({
    where: {
      organizationId: user.organizationId,
      slug: effectiveRole.toLowerCase(),
      permissions: { some: { permission: { in: [permission, '*'] } } },
    },
  })
  if (!systemRole) throw AppError.forbidden(`Missing permission: ${permission}`)
}

async function currentMembership(user: AuthRequest['user'], permission?: string) {
  if (!user) return null
  return prisma.organizationMember.findFirst({
    where: {
      organizationId: user.organizationId,
      userId: user.id,
      user: { isActive: true, emailVerified: true },
    },
    include: {
      assignedRole: permission
        ? { include: { permissions: { where: { permission: { in: [permission, '*'] } } } } }
        : true,
    },
  })
}
