import { OrganizationRole, prisma, Prisma } from '@stokku/database'
import { AppError } from '../../utils/errors'
import { canAssignRole } from '../../middleware/rbac'
import { parsePagination, paginatedResult } from '../../utils/pagination'
import { roleLevel } from '../../middleware/rbac'

export const UsersService = {
  async list(orgId: string, query: Record<string, any>) {
    const pagination = parsePagination(query)
    const where: Prisma.UserWhereInput = { organizationId: orgId }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          avatarUrl: true,
        },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
      }),
      prisma.user.count({ where }),
    ])

    return paginatedResult(data, total, pagination)
  },

  async updateRole(orgId: string, actorUserId: string, userId: string, role: OrganizationRole) {
    const actor = await prisma.user.findFirst({
      where: { id: actorUserId, organizationId: orgId, isActive: true },
      select: { id: true, role: true },
    })
    if (!actor) throw AppError.forbidden('Active organization membership required')

    const user = await prisma.user.findFirst({ where: { id: userId, organizationId: orgId } })
    if (!user) throw AppError.notFound('User not found')
    if (!canAssignRole(actor.role, role)) {
      throw AppError.forbidden('You cannot assign this role')
    }
    if (user.role === 'OWNER' && role !== 'OWNER') {
      throw AppError.forbidden('The organization owner must be transferred explicitly')
    }

    return prisma.$transaction(async tx => {
      const assignedRole = await tx.role.findFirst({
        where: { organizationId: orgId, slug: role.toLowerCase(), isSystem: true },
      })
      await tx.organizationMember.upsert({
        where: { organizationId_userId: { organizationId: orgId, userId } },
        update: { role, roleId: assignedRole?.id ?? null },
        create: { organizationId: orgId, userId, role, roleId: assignedRole?.id ?? null },
      })
      return tx.user.update({
        where: { id: userId },
        // Transitional mirror for existing access tokens. OrganizationMember is
        // the authoritative role assignment for permission checks.
        data: { role },
        select: { id: true, name: true, email: true, role: true },
      })
    })
  },

  async deactivate(orgId: string, actorUserId: string, userId: string) {
    if (actorUserId === userId) throw AppError.forbidden('You cannot deactivate your own account')

    const actor = await prisma.organizationMember.findFirst({
      where: {
        organizationId: orgId,
        userId: actorUserId,
        user: { isActive: true, emailVerified: true },
      },
      select: { role: true },
    })
    if (!actor) throw AppError.forbidden('Active organization membership required')

    const user = await prisma.user.findFirst({ where: { id: userId, organizationId: orgId } })
    if (!user) throw AppError.notFound('User not found')
    if (roleLevel(actor.role) <= roleLevel(user.role)) {
      throw AppError.forbidden('You cannot deactivate this user')
    }
    if (user.role === 'OWNER')
      throw AppError.forbidden('The organization owner cannot be deactivated')

    return prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    })
  },
}
