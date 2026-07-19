import { prisma, Prisma } from '@stokku/database';
import { AppError } from '../../utils/errors';

export const CategoryService = {
  async list(orgId: string) {
    return prisma.category.findMany({
      where: { organizationId: orgId },
      include: { children: { include: { _count: { select: { products: true } } } }, _count: { select: { products: true } } },
      orderBy: { sortOrder: 'asc' },
    });
  },

  async getById(orgId: string, id: string) {
    const category = await prisma.category.findFirst({
      where: { id, organizationId: orgId },
      include: { children: true, parent: true, _count: { select: { products: true } } },
    });
    if (!category) throw AppError.notFound('Category not found');
    return category;
  },

  async create(orgId: string, data: { name: string; slug?: string; description?: string; parentId?: string; color?: string; sortOrder?: number }) {
    const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-');
    const existing = await prisma.category.findFirst({ where: { organizationId: orgId, slug } });
    if (existing) throw AppError.conflict('Category slug already exists');

    return prisma.category.create({
      data: { ...data, slug, organizationId: orgId },
    });
  },

  async update(orgId: string, id: string, data: any) {
    const category = await prisma.category.findFirst({ where: { id, organizationId: orgId } });
    if (!category) throw AppError.notFound('Category not found');

    if (data.slug) {
      const existing = await prisma.category.findFirst({ where: { organizationId: orgId, slug: data.slug, id: { not: id } } });
      if (existing) throw AppError.conflict('Category slug already exists');
    }

    return prisma.category.update({ where: { id }, data });
  },

  async delete(orgId: string, id: string) {
    const category = await prisma.category.findFirst({ where: { id, organizationId: orgId }, include: { _count: { select: { products: true } } } });
    if (!category) throw AppError.notFound('Category not found');
    if (category._count.products > 0) throw AppError.badRequest('Cannot delete category with existing products');

    await prisma.category.delete({ where: { id } });
  },
};
