import { OrganizationRole, prisma } from '@stokku/database';
import { roleLevel } from '../../middleware/rbac';
import { AppError } from '../../utils/errors';

function canManageTarget(actorRole: OrganizationRole, targetRole: OrganizationRole): boolean {
  return actorRole === 'OWNER'
    ? targetRole !== 'OWNER'
    : roleLevel(actorRole) > roleLevel(targetRole);
}

async function getMembership(orgId: string, userId: string) {
  return prisma.organizationMember.findFirst({
    where: {
      organizationId: orgId,
      userId,
      user: { isActive: true, emailVerified: true },
    },
    select: { id: true, role: true },
  });
}

export const WarehouseAssignmentsService = {
  async list(orgId: string, actorUserId: string, targetUserId: string) {
    const actor = await getMembership(orgId, actorUserId);
    if (!actor) throw AppError.forbidden('Active organization membership required');

    const target = await getMembership(orgId, targetUserId);
    if (!target) throw AppError.notFound('User not found');
    if (actorUserId !== targetUserId && !canManageTarget(actor.role, target.role)) {
      throw AppError.forbidden('You cannot manage this user');
    }

    const assignments = await prisma.organizationMemberWarehouse.findMany({
      where: { organizationId: orgId, organizationMemberId: target.id },
      select: {
        warehouse: { select: { id: true, name: true, code: true, isActive: true } },
        assignedAt: true,
      },
      orderBy: { assignedAt: 'asc' },
    });
    return assignments.map(({ warehouse, assignedAt }) => ({ ...warehouse, assignedAt }));
  },

  async replace(
    orgId: string,
    actorUserId: string,
    targetUserId: string,
    warehouseIds: string[],
  ) {
    const actor = await getMembership(orgId, actorUserId);
    if (!actor) throw AppError.forbidden('Active organization membership required');

    const target = await getMembership(orgId, targetUserId);
    if (!target) throw AppError.notFound('User not found');
    if (!canManageTarget(actor.role, target.role)) {
      throw AppError.forbidden('You cannot manage this user');
    }

    const uniqueWarehouseIds = [...new Set(warehouseIds)];
    const warehouses = await prisma.warehouse.findMany({
      where: { organizationId: orgId, id: { in: uniqueWarehouseIds }, isActive: true },
      select: { id: true },
    });
    if (warehouses.length !== uniqueWarehouseIds.length) {
      throw AppError.notFound('One or more warehouses were not found');
    }

    await prisma.$transaction(async (tx) => {
      await tx.organizationMemberWarehouse.deleteMany({
        where: { organizationId: orgId, organizationMemberId: target.id },
      });
      if (uniqueWarehouseIds.length > 0) {
        await tx.organizationMemberWarehouse.createMany({
          data: uniqueWarehouseIds.map((warehouseId) => ({
            organizationId: orgId,
            organizationMemberId: target.id,
            warehouseId,
          })),
        });
      }
      await tx.auditLog.create({
        data: {
          organizationId: orgId,
          userId: actorUserId,
          action: 'WAREHOUSE_SCOPE_REPLACED',
          entityType: 'OrganizationMember',
          entityId: target.id,
          newValues: JSON.stringify({ warehouseIds: uniqueWarehouseIds }),
        },
      });
    });

    return this.list(orgId, actorUserId, targetUserId);
  },
};
