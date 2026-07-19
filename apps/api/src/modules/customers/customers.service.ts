import { prisma, Prisma } from '@stokku/database';
import { AppError } from '../../utils/errors';
import { parsePagination, paginatedResult } from '../../utils/pagination';

export const CustomerService = {
  async list(orgId: string, query: Record<string, any>) {
    const pagination = parsePagination(query);
    const where: Prisma.CustomerWhereInput = { organizationId: orgId };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: { _count: { select: { salesOrders: true } } },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
      }),
      prisma.customer.count({ where }),
    ]);

    return paginatedResult(data, total, pagination);
  },

  async getById(orgId: string, id: string) {
    const customer = await prisma.customer.findFirst({
      where: { id, organizationId: orgId },
      include: { salesOrders: { take: 20, orderBy: { createdAt: 'desc' } } },
    });
    if (!customer) throw AppError.notFound('Customer not found');
    return customer;
  },

  async create(orgId: string, data: any) {
    return prisma.customer.create({ data: { ...data, organizationId: orgId } });
  },

  async update(orgId: string, id: string, data: any) {
    const customer = await prisma.customer.findFirst({ where: { id, organizationId: orgId } });
    if (!customer) throw AppError.notFound('Customer not found');
    return prisma.customer.update({ where: { id }, data });
  },

  async delete(orgId: string, id: string) {
    const customer = await prisma.customer.findFirst({ where: { id, organizationId: orgId } });
    if (!customer) throw AppError.notFound('Customer not found');
    await prisma.customer.update({ where: { id }, data: { isActive: false } });
  },
};
