import { Prisma, PrismaClient, prisma } from '@stokku/database';
import { AppError } from '../utils/errors';

export type WarehouseScopeClient = PrismaClient | Prisma.TransactionClient;

export type WarehouseScope = {
  global: boolean;
  warehouseIds: string[];
};

const GLOBAL_ROLES = new Set(['OWNER', 'ADMIN']);

export async function getWarehouseScope(
  client: WarehouseScopeClient,
  organizationId: string,
  userId: string,
): Promise<WarehouseScope> {
  const membership = await client.organizationMember.findFirst({
    where: {
      organizationId,
      userId,
      user: { isActive: true, emailVerified: true },
    },
    select: { id: true, role: true },
  });

  if (!membership) throw AppError.forbidden('Active organization membership required');
  if (GLOBAL_ROLES.has(membership.role)) return { global: true, warehouseIds: [] };

  const assignments = await client.organizationMemberWarehouse.findMany({
    where: { organizationId, organizationMemberId: membership.id },
    select: { warehouseId: true },
  });

  return {
    global: false,
    warehouseIds: assignments.map(({ warehouseId }) => warehouseId),
  };
}

export async function assertGlobalWarehouseScope(
  client: WarehouseScopeClient,
  organizationId: string,
  userId: string,
): Promise<void> {
  const scope = await getWarehouseScope(client, organizationId, userId);
  if (!scope.global) throw AppError.forbidden('Organization-wide warehouse authority required');
}

export async function assertHasWarehouseScope(
  client: WarehouseScopeClient,
  organizationId: string,
  userId: string,
): Promise<WarehouseScope> {
  const scope = await getWarehouseScope(client, organizationId, userId);
  if (!scope.global && scope.warehouseIds.length === 0) {
    throw AppError.forbidden('Warehouse assignment required');
  }
  return scope;
}

export async function assertWarehouseAccess(
  client: WarehouseScopeClient = prisma,
  organizationId: string,
  userId: string,
  warehouseId: string,
): Promise<void> {
  const scope = await getWarehouseScope(client, organizationId, userId);
  const warehouse = await client.warehouse.findFirst({
    where: { id: warehouseId, organizationId },
    select: { id: true },
  });
  if (!warehouse) throw AppError.notFound('Warehouse not found');
  if (!scope.global && !scope.warehouseIds.includes(warehouseId)) {
    throw AppError.forbidden('Warehouse access required');
  }
}

export async function assertWarehouseAccessToAll(
  client: WarehouseScopeClient,
  organizationId: string,
  userId: string,
  warehouseIds: string[],
): Promise<void> {
  for (const warehouseId of [...new Set(warehouseIds)]) {
    await assertWarehouseAccess(client, organizationId, userId, warehouseId);
  }
}

export function warehouseIdFilter(scope: WarehouseScope): { in: string[] } | undefined {
  return scope.global ? undefined : { in: scope.warehouseIds };
}
