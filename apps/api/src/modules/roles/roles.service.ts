import { prisma } from '@stokku/database';
import { AppError } from '../../utils/errors';
import { SYSTEM_ROLE_PERMISSIONS } from './system-permissions';

const SYSTEM_ROLE_SLUGS = new Set(Object.keys(SYSTEM_ROLE_PERMISSIONS).map((role) => role.toLowerCase()));

function validateCustomPermissions(permissions: string[] = []) {
  if (permissions.some((permission) => permission === '*')) {
    throw AppError.badRequest('Custom roles cannot grant wildcard permissions');
  }
}

async function getActorPermissions(orgId: string, actorUserId: string): Promise<Set<string>> {
  const actor = await prisma.organizationMember.findFirst({
    where: {
      organizationId: orgId,
      userId: actorUserId,
      user: { isActive: true, emailVerified: true },
    },
    include: { assignedRole: { include: { permissions: true } } },
  });
  if (!actor) throw AppError.forbidden('Active organization membership required');
  if (actor.role === 'OWNER') return new Set(['*']);

  const permissions = new Set(SYSTEM_ROLE_PERMISSIONS[actor.role] ?? []);
  for (const permission of actor.assignedRole?.permissions ?? []) {
    permissions.add(permission.permission);
  }
  return permissions;
}

async function assertRoleAuthority(orgId: string, actorUserId: string, permissions: string[]) {
  const allowedPermissions = await getActorPermissions(orgId, actorUserId);
  if (permissions.some((permission) => !allowedPermissions.has(permission) && !allowedPermissions.has('*'))) {
    throw AppError.forbidden('You cannot grant permissions above your authority');
  }
}

export const RolesService = {
  async list(orgId: string) {
    return prisma.role.findMany({
      where: { organizationId: orgId },
      include: { permissions: true },
      orderBy: { name: 'asc' },
    });
  },

  async create(orgId: string, actorUserId: string, data: { name: string; slug: string; description?: string; permissions: string[] }) {
    if (SYSTEM_ROLE_SLUGS.has(data.slug)) throw AppError.badRequest('System role slugs are reserved');
    validateCustomPermissions(data.permissions);
    await assertRoleAuthority(orgId, actorUserId, data.permissions);
    const existing = await prisma.role.findFirst({ where: { organizationId: orgId, slug: data.slug } });
    if (existing) throw AppError.conflict('Role slug already exists');

    return prisma.role.create({
      data: {
        organizationId: orgId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        permissions: {
          create: data.permissions.map(p => ({ permission: p })),
        },
      },
      include: { permissions: true },
    });
  },

  async update(orgId: string, actorUserId: string, id: string, data: { name?: string; slug?: string; description?: string; permissions?: string[] }) {
    const role = await prisma.role.findFirst({ where: { id, organizationId: orgId } });
    if (!role) throw AppError.notFound('Role not found');
    if (role.isSystem) throw AppError.badRequest('Cannot modify system role');
    if (data.slug && SYSTEM_ROLE_SLUGS.has(data.slug)) throw AppError.badRequest('System role slugs are reserved');
    if (data.slug && data.slug !== role.slug) {
      const existing = await prisma.role.findFirst({ where: { organizationId: orgId, slug: data.slug, id: { not: id } } });
      if (existing) throw AppError.conflict('Role slug already exists');
    }

    if (data.permissions) {
      validateCustomPermissions(data.permissions);
      await assertRoleAuthority(orgId, actorUserId, data.permissions);
      await prisma.rolePermission.deleteMany({ where: { roleId: id } });
      await prisma.rolePermission.createMany({
        data: data.permissions.map(p => ({ roleId: id, permission: p })),
      });
    }

    return prisma.role.update({
      where: { id },
      data: { name: data.name, slug: data.slug, description: data.description },
      include: { permissions: true },
    });
  },

  async delete(orgId: string, actorUserId: string, id: string) {
    const role = await prisma.role.findFirst({
      where: { id, organizationId: orgId },
      include: { permissions: true },
    });
    if (!role) throw AppError.notFound('Role not found');
    if (role.isSystem) throw AppError.badRequest('Cannot delete system role');
    await assertRoleAuthority(orgId, actorUserId, role.permissions?.map(({ permission }) => permission) ?? []);

    await prisma.role.delete({ where: { id } });
  },
};
