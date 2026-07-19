import { prisma, Product, ProductVariant } from '@stokku/database';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
  category: { id: string; name: string } | null;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
}

export class ProductService {
  static async list(workspaceId: string, params: {
    skip?: number;
    take?: number;
    search?: string;
    categoryId?: string;
    status?: string;
  }): Promise<PaginatedResult<ProductWithVariants>> {
    const { skip = 0, take = 10, search, categoryId, status } = params;

    const where: Record<string, unknown> = { workspaceId };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { variants: { some: { sku: { contains: search } } } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;

    const [data, count] = await Promise.all([
      prisma.product.findMany({
        skip,
        take,
        where: where as any,
        orderBy: { createdAt: 'desc' },
        include: {
          variants: { orderBy: { sortOrder: 'asc' } },
          category: { select: { id: true, name: true } },
        },
      }),
      prisma.product.count({ where: where as any }),
    ]);

    return { data: data as ProductWithVariants[], count };
  }

  static async getById(id: string, workspaceId: string): Promise<ProductWithVariants> {
    const product = await prisma.product.findFirst({
      where: { id, workspaceId },
      include: {
        variants: { orderBy: { sortOrder: 'asc' } },
        category: { select: { id: true, name: true } },
      },
    });

    if (!product) throw AppError.notFound('Product not found');
    return product as ProductWithVariants;
  }

  static async create(data: {
    workspaceId: string;
    categoryId?: string;
    name: string;
    description?: string;
    baseUom?: string;
    tags?: string[];
    initialVariant: {
      sku: string;
      name: string;
      price?: number;
      costPrice?: number;
      barcode?: string;
    };
  }): Promise<ProductWithVariants> {
    logger.info('Product:create', { name: data.name, workspaceId: data.workspaceId });

    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: data.categoryId, workspaceId: data.workspaceId },
      });
      if (!category) throw AppError.notFound('Category not found');
    }

    const existingVariant = await prisma.productVariant.findFirst({
      where: { sku: data.initialVariant.sku },
      include: { product: { select: { workspaceId: true } } },
    });
    if (existingVariant && existingVariant.product.workspaceId === data.workspaceId) {
      throw AppError.conflict(`SKU "${data.initialVariant.sku}" already exists in this workspace`);
    }

    const product = await prisma.product.create({
      data: {
        workspaceId: data.workspaceId,
        categoryId: data.categoryId ?? null,
        name: data.name,
        description: data.description ?? null,
        baseUom: data.baseUom ?? 'pcs',
        tags: JSON.stringify(data.tags ?? []),
        variants: {
          create: {
            sku: data.initialVariant.sku,
            name: data.initialVariant.name,
            price: data.initialVariant.price ?? null,
            costPrice: data.initialVariant.costPrice ?? null,
            barcode: data.initialVariant.barcode ?? null,
          },
        },
      },
      include: {
        variants: true,
        category: { select: { id: true, name: true } },
      },
    });

    return product as ProductWithVariants;
  }

  static async addVariant(productId: string, workspaceId: string, data: {
    sku: string;
    name: string;
    price?: number;
    costPrice?: number;
    barcode?: string;
    options?: Record<string, string>;
  }): Promise<ProductVariant> {
    const product = await prisma.product.findFirst({ where: { id: productId, workspaceId } });
    if (!product) throw AppError.notFound('Product not found');

    const existing = await prisma.productVariant.findFirst({
      where: { sku: data.sku },
      include: { product: { select: { workspaceId: true } } },
    });
    if (existing && existing.product.workspaceId === workspaceId) {
      throw AppError.conflict(`SKU "${data.sku}" already exists`);
    }

    const maxSort = await prisma.productVariant.aggregate({
      where: { productId },
      _max: { sortOrder: true },
    });

    return prisma.productVariant.create({
      data: {
        productId,
        sku: data.sku,
        name: data.name,
        price: data.price ?? null,
        costPrice: data.costPrice ?? null,
        barcode: data.barcode ?? null,
        options: JSON.stringify(data.options ?? {}),
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      },
    });
  }

  static async update(id: string, workspaceId: string, data: {
    name?: string;
    description?: string | null;
    categoryId?: string | null;
    baseUom?: string;
    status?: string;
    tags?: string[];
  }): Promise<ProductWithVariants> {
    const product = await prisma.product.findFirst({ where: { id, workspaceId } });
    if (!product) throw AppError.notFound('Product not found');

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.baseUom !== undefined) updateData.baseUom = data.baseUom;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        variants: { orderBy: { sortOrder: 'asc' } },
        category: { select: { id: true, name: true } },
      },
    });

    return updated as ProductWithVariants;
  }

  static async delete(id: string, workspaceId: string): Promise<void> {
    const product = await prisma.product.findFirst({ where: { id, workspaceId } });
    if (!product) throw AppError.notFound('Product not found');

    await prisma.product.delete({ where: { id } });
  }
}
