import { prisma, Supplier } from '@stokku/database';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export class SupplierService {
  static async list(workspaceId: string, params: {
    skip?: number;
    take?: number;
    search?: string;
  }) {
    const { skip = 0, take = 20, search } = params;

    const where: Record<string, unknown> = { workspaceId };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [data, count] = await Promise.all([
      prisma.supplier.findMany({
        skip,
        take,
        where: where as any,
        orderBy: { name: 'asc' },
      }),
      prisma.supplier.count({ where: where as any }),
    ]);

    return { data, count };
  }

  static async getById(id: string, workspaceId: string): Promise<Supplier> {
    const supplier = await prisma.supplier.findFirst({ where: { id, workspaceId } });
    if (!supplier) throw AppError.notFound('Supplier not found');
    return supplier;
  }

  static async create(data: {
    workspaceId: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    paymentTerms?: string;
    currency?: string;
    notes?: string;
  }): Promise<Supplier> {
    logger.info('Supplier:create', { name: data.name, workspaceId: data.workspaceId });

    return prisma.supplier.create({
      data: {
        workspaceId: data.workspaceId,
        name: data.name,
        email: data.email ?? null,
        phone: data.phone ?? null,
        address: data.address ?? null,
        paymentTerms: data.paymentTerms ?? null,
        currency: data.currency ?? 'USD',
        notes: data.notes ?? null,
      },
    });
  }

  static async update(id: string, workspaceId: string, data: Partial<Supplier>): Promise<Supplier> {
    const supplier = await prisma.supplier.findFirst({ where: { id, workspaceId } });
    if (!supplier) throw AppError.notFound('Supplier not found');

    return prisma.supplier.update({ where: { id }, data });
  }

  static async delete(id: string, workspaceId: string): Promise<void> {
    const supplier = await prisma.supplier.findFirst({ where: { id, workspaceId } });
    if (!supplier) throw AppError.notFound('Supplier not found');

    const productCount = await prisma.productSupplier.count({ where: { supplierId: id } });
    if (productCount > 0) {
      throw AppError.badRequest('Cannot delete supplier with associated products. Remove product-supplier links first.');
    }

    await prisma.supplier.delete({ where: { id } });
  }
}
