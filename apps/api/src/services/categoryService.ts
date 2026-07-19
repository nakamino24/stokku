import { prisma, Category } from '@stokku/database';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
}

export class CategoryService {
  static async list(workspaceId: string): Promise<CategoryTreeNode[]> {
    const categories = await prisma.category.findMany({
      where: { workspaceId },
      orderBy: { sortOrder: 'asc' },
    });

    return CategoryService.buildTree(categories);
  }

  static async getById(id: string, workspaceId: string): Promise<Category> {
    const category = await prisma.category.findFirst({
      where: { id, workspaceId },
    });
    if (!category) throw AppError.notFound('Category not found');
    return category;
  }

  static async create(data: {
    workspaceId: string;
    name: string;
    slug: string;
    parentId?: string;
    description?: string;
    color?: string;
    sortOrder?: number;
  }): Promise<Category> {
    logger.info('Category:create', { name: data.name, workspaceId: data.workspaceId });

    if (data.parentId) {
      const parent = await prisma.category.findFirst({
        where: { id: data.parentId, workspaceId: data.workspaceId },
      });
      if (!parent) throw AppError.notFound('Parent category not found');
    }

    const existing = await prisma.category.findFirst({
      where: { workspaceId: data.workspaceId, slug: data.slug },
    });
    if (existing) throw AppError.conflict(`Category with slug "${data.slug}" already exists`);

    return prisma.category.create({
      data: {
        workspaceId: data.workspaceId,
        name: data.name,
        slug: data.slug,
        parentId: data.parentId ?? null,
        description: data.description ?? null,
        color: data.color ?? null,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  static async update(id: string, workspaceId: string, data: {
    name?: string;
    slug?: string;
    parentId?: string | null;
    description?: string | null;
    color?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<Category> {
    logger.info('Category:update', { id });

    const category = await prisma.category.findFirst({ where: { id, workspaceId } });
    if (!category) throw AppError.notFound('Category not found');

    if (data.parentId !== undefined && data.parentId !== null) {
      if (data.parentId === id) throw AppError.badRequest('Category cannot be its own parent');
      const parent = await prisma.category.findFirst({
        where: { id: data.parentId, workspaceId },
      });
      if (!parent) throw AppError.notFound('Parent category not found');
    }

    if (data.slug && data.slug !== category.slug) {
      const existing = await prisma.category.findFirst({
        where: { workspaceId, slug: data.slug, id: { not: id } },
      });
      if (existing) throw AppError.conflict(`Category with slug "${data.slug}" already exists`);
    }

    return prisma.category.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string, workspaceId: string): Promise<void> {
    logger.info('Category:delete', { id });

    const category = await prisma.category.findFirst({ where: { id, workspaceId } });
    if (!category) throw AppError.notFound('Category not found');

    const childrenCount = await prisma.category.count({ where: { parentId: id } });
    if (childrenCount > 0) {
      throw AppError.badRequest('Cannot delete category with subcategories. Remove children first.');
    }

    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      throw AppError.badRequest('Cannot delete category with associated products.');
    }

    await prisma.category.delete({ where: { id } });
  }

  private static buildTree(categories: Category[]): CategoryTreeNode[] {
    const map = new Map<string, CategoryTreeNode>();
    const roots: CategoryTreeNode[] = [];

    for (const cat of categories) {
      map.set(cat.id, { ...cat, children: [] });
    }

    for (const cat of categories) {
      const node = map.get(cat.id)!;
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
