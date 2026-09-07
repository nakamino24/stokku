import { Prisma, prisma } from '@stokku/database';
import { AppError } from '../../utils/errors';
import { parsePagination, paginatedResult } from '../../utils/pagination';

interface VariantInput {
  id?: string;
  name?: string;
  sku?: string | null;
  barcode?: string | null;
  unitPrice?: Prisma.Decimal.Value;
  costPrice?: Prisma.Decimal.Value;
  options?: Record<string, string>;
  sortOrder?: number;
  isActive?: boolean;
}

interface ProductInput {
  name?: string;
  sku?: string | null;
  barcode?: string | null;
  description?: string | null;
  categoryId?: string | null;
  unitPrice?: Prisma.Decimal.Value;
  costPrice?: Prisma.Decimal.Value;
  taxRate?: Prisma.Decimal.Value;
  unit?: string;
  minStock?: Prisma.Decimal.Value;
  maxStock?: Prisma.Decimal.Value | null;
  imageUrl?: string | null;
  weight?: Prisma.Decimal.Value | null;
  weightUnit?: string;
  isActive?: boolean;
  variants?: VariantInput[];
  supplierIds?: string[];
}

const productInclude = {
  category: true,
  variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' as const } },
  suppliers: { include: { supplier: true } },
  _count: { select: { stockLevels: true, movements: true } },
} satisfies Prisma.ProductInclude;

async function validateRelations(
  tx: Prisma.TransactionClient,
  organizationId: string,
  categoryId: string | null | undefined,
  supplierIds: string[] | undefined,
): Promise<void> {
  if (categoryId) {
    const category = await tx.category.findFirst({ where: { id: categoryId, organizationId } });
    if (!category) throw AppError.notFound('Category not found');
  }
  if (supplierIds?.length) {
    const count = await tx.supplier.count({
      where: { id: { in: supplierIds }, organizationId, status: 'ACTIVE' },
    });
    if (count !== new Set(supplierIds).size) throw AppError.notFound('Supplier not found');
  }
}

export const ProductService = {
  async list(orgId: string, query: Record<string, unknown>) {
    const pagination = parsePagination(query);
    const where: Prisma.ProductWhereInput = { organizationId: orgId };

    if (typeof query.search === 'string' && query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
        { barcode: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (typeof query.categoryId === 'string') where.categoryId = query.categoryId;
    if (typeof query.status === 'string') where.status = query.status as Prisma.EnumProductStatusFilter['equals'];
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
        movements: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: { warehouse: true, createdBy: { select: { name: true } } },
        },
      },
    });
    if (!product) throw AppError.notFound('Product not found');
    return product;
  },

  async create(orgId: string, userId: string, data: ProductInput & { name: string }) {
    return prisma.$transaction(async (tx) => {
      const existing = data.sku
        ? await tx.product.findFirst({ where: { organizationId: orgId, sku: data.sku } })
        : null;
      if (existing) throw AppError.conflict('Product SKU already exists');
      await validateRelations(tx, orgId, data.categoryId, data.supplierIds);

      const { variants, supplierIds, ...productData } = data;
      if (variants?.some((variant) => !variant.name)) {
        throw AppError.badRequest('New variants require a name');
      }
      const product = await tx.product.create({
        data: {
          ...productData,
          organizationId: orgId,
          variants: variants?.length ? {
            create: variants.map(({ id: _id, ...variant }) => ({
              ...variant,
              name: variant.name!,
              options: variant.options ? JSON.stringify(variant.options) : '{}',
            })),
          } : undefined,
          suppliers: supplierIds?.length ? {
            create: supplierIds.map((supplierId) => ({ supplierId })),
          } : undefined,
        },
        include: productInclude,
      });
      await tx.auditLog.create({
        data: { organizationId: orgId, userId, action: 'CREATE', entityType: 'Product', entityId: product.id },
      });
      return product;
    });
  },

  async update(orgId: string, userId: string, id: string, data: ProductInput) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({ where: { id, organizationId: orgId } });
      if (!product) throw AppError.notFound('Product not found');
      if (data.sku && data.sku !== product.sku) {
        const duplicate = await tx.product.findFirst({ where: { organizationId: orgId, sku: data.sku } });
        if (duplicate) throw AppError.conflict('Product SKU already exists');
      }
      await validateRelations(tx, orgId, data.categoryId, data.supplierIds);

      const { variants, supplierIds, ...productData } = data;
      if (variants) {
        const current = await tx.productVariant.findMany({ where: { productId: id } });
        const retainedIds = new Set<string>();
        for (const variant of variants) {
          const { id: variantId, ...variantData } = variant;
          const normalized = {
            ...variantData,
            options: variantData.options ? JSON.stringify(variantData.options) : undefined,
          };
          if (variantId) {
            if (!current.some((item) => item.id === variantId)) {
              throw AppError.notFound('Product variant not found');
            }
            retainedIds.add(variantId);
            await tx.productVariant.update({ where: { id: variantId }, data: normalized });
          } else {
            if (!variantData.name) throw AppError.badRequest('New variants require a name');
            const created = await tx.productVariant.create({
              data: { ...normalized, name: variantData.name, productId: id },
            });
            retainedIds.add(created.id);
          }
        }

        const archivedIds = current.filter((variant) => !retainedIds.has(variant.id)).map((variant) => variant.id);
        if (archivedIds.length) {
          await tx.productVariant.updateMany({
            where: { id: { in: archivedIds }, productId: id },
            data: { isActive: false },
          });
        }
      }

      if (supplierIds) {
        await tx.productSupplier.deleteMany({ where: { productId: id } });
        if (supplierIds.length) {
          await tx.productSupplier.createMany({
            data: supplierIds.map((supplierId) => ({ productId: id, supplierId })),
          });
        }
      }

      const updated = await tx.product.update({
        where: { id },
        data: productData,
        include: productInclude,
      });
      await tx.auditLog.create({
        data: { organizationId: orgId, userId, action: 'UPDATE', entityType: 'Product', entityId: id },
      });
      return updated;
    });
  },

  async delete(orgId: string, userId: string, id: string) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({ where: { id, organizationId: orgId } });
      if (!product) throw AppError.notFound('Product not found');
      await tx.product.update({ where: { id }, data: { isActive: false, status: 'DISCONTINUED' } });
      await tx.auditLog.create({
        data: { organizationId: orgId, userId, action: 'DELETE', entityType: 'Product', entityId: id },
      });
    });
  },
};
