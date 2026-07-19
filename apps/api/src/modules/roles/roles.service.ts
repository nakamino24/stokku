import { prisma } from '@stokku/database';
import { AppError } from '../../utils/errors';

export const RolesService = {
  async list(orgId: string) {
    return prisma.role.findMany({
      where: { organizationId: orgId },
      include: { permissions: true },
      orderBy: { name: 'asc' },
    });
  },

  async create(orgId: string, data: { name: string; slug: string; description?: string; permissions: string[] }) {
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

  async update(orgId: string, id: string, data: { name?: string; description?: string; permissions?: string[] }) {
    const role = await prisma.role.findFirst({ where: { id, organizationId: orgId } });
    if (!role) throw AppError.notFound('Role not found');

    if (data.permissions) {
      await prisma.rolePermission.deleteMany({ where: { roleId: id } });
      await prisma.rolePermission.createMany({
        data: data.permissions.map(p => ({ roleId: id, permission: p })),
      });
    }

    return prisma.role.update({
      where: { id },
      data: { name: data.name, description: data.description },
      include: { permissions: true },
    });
  },

  async delete(orgId: string, id: string) {
    const role = await prisma.role.findFirst({ where: { id, organizationId: orgId } });
    if (!role) throw AppError.notFound('Role not found');
    if (role.isSystem) throw AppError.badRequest('Cannot delete system role');

    await prisma.role.delete({ where: { id } });
  },
};
