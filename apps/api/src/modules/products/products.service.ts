import { prisma, Prisma } from '@stokku/database';
import { AppError } from '../../utils/errors';
import { parsePagination, paginatedResult } from '../../utils/pagination';

const productInclude = {
  category: true,
  variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' as const } },
  suppliers: { include: { supplier: true } },
  _count: { select: { stockLevels: true, movements: true } },
} satisfies Prisma.ProductInclude;

export const ProductService = {
  async list(orgId: string, query: Record<string, any>) {
    const pagination = parsePagination(query);
    const where: Prisma.ProductWhereInput = { organizationId: orgId };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
        { barcode: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.status) where.status = query.status;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productInclude,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
      }),
      prisma.product.count({ where }),
    ]);

    return paginatedResult(data, total, pagination);
  },

  async getById(orgId: string, id: string) {
    const product = await prisma.product.findFirst({
      where: { id, organizationId: orgId },
      include: {
        ...productInclude,
        stockLevels: { include: { warehouse: true } },
        movements: { take: 50, orderBy: { createdAt: 'desc' }, include: { warehouse: true, createdBy: { select: { name: true } } } },
      },
    });
    if (!product) throw AppError.notFound('Product not found');
    return product;
  },

  async create(orgId: string, userId: string, data: any) {
    const existing = data.sku ? await prisma.product.findFirst({ where: { organizationId: orgId, sku: data.sku } }) : null;
    if (existing) throw AppError.conflict('Product SKU already exists');

    const { variants, supplierIds, ...productData } = data;

    const product = await prisma.product.create({
      data: {
        ...productData,
        organizationId: orgId,
        variants: variants?.length ? {
          create: variants.map((v: any) => ({
            ...v,
            options: v.options ? JSON.stringify(v.options) : '{}',
          })),
        } : undefined,
        suppliers: supplierIds?.length ? {
          create: supplierIds.map((supplierId: string) => ({ supplierId })),
        } : undefined,
      },
      include: productInclude,
    });

    await prisma.auditLog.create({
      data: { organizationId: orgId, userId, action: 'CREATE', entityType: 'Product', entityId: product.id },
    });

    return product;
  },

  async update(orgId: string, userId: string, id: string, data: any) {
    const product = await prisma.product.findFirst({ where: { id, organizationId: orgId } });
    if (!product) throw AppError.notFound('Product not found');

    const { variants, supplierIds, ...productData } = data;

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...productData,
        ...(variants ? {
          variants: {
            deleteMany: {},
            create: variants.map((v: any) => ({
              ...v,
              options: v.options ? JSON.stringify(v.options) : '{}',
            })),
          },
        } : {}),
        ...(supplierIds ? {
          suppliers: {
            deleteMany: {},
            create: supplierIds.map((supplierId: string) => ({ supplierId })),
          },
        } : {}),
      },
      include: productInclude,
    });

    await prisma.auditLog.create({
      data: { organizationId: orgId, userId, action: 'UPDATE', entityType: 'Product', entityId: id },
    });

    return updated;
  },

  async delete(orgId: string, userId: string, id: string) {
    const product = await prisma.product.findFirst({ where: { id, organizationId: orgId } });
    if (!product) throw AppError.notFound('Product not found');

    await prisma.product.update({ where: { id }, data: { isActive: false, status: 'DISCONTINUED' } });

    await prisma.auditLog.create({
      data: { organizationId: orgId, userId, action: 'DELETE', entityType: 'Product', entityId: id },
    });
  },
};
