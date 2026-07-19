import { prisma, Prisma } from '@stokku/database';
import { AppError } from '../../utils/errors';
import { parsePagination, paginatedResult } from '../../utils/pagination';

export const SupplierService = {
  async list(orgId: string, query: Record<string, any>) {
    const pagination = parsePagination(query);
    const where: Prisma.SupplierWhereInput = { organizationId: orgId };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { contactPerson: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: { _count: { select: { products: true, purchaseOrders: true } } },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
      }),
      prisma.supplier.count({ where }),
    ]);

    return paginatedResult(data, total, pagination);
  },

  async getById(orgId: string, id: string) {
    const supplier = await prisma.supplier.findFirst({
      where: { id, organizationId: orgId },
      include: {
        products: { include: { product: { include: { category: true } } } },
        purchaseOrders: { take: 20, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!supplier) throw AppError.notFound('Supplier not found');
    return supplier;
  },

  async create(orgId: string, data: any) {
    return prisma.supplier.create({ data: { ...data, organizationId: orgId } });
  },

  async update(orgId: string, id: string, data: any) {
    const supplier = await prisma.supplier.findFirst({ where: { id, organizationId: orgId } });
    if (!supplier) throw AppError.notFound('Supplier not found');
    return prisma.supplier.update({ where: { id }, data });
  },

  async delete(orgId: string, id: string) {
    const supplier = await prisma.supplier.findFirst({ where: { id, organizationId: orgId } });
    if (!supplier) throw AppError.notFound('Supplier not found');
    await prisma.supplier.update({ where: { id }, data: { status: 'INACTIVE' } });
  },
};
