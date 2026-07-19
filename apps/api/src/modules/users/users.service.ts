import { prisma, Prisma } from '@stokku/database';
import { AppError } from '../../utils/errors';
import { parsePagination, paginatedResult } from '../../utils/pagination';

export const UsersService = {
  async list(orgId: string, query: Record<string, any>) {
    const pagination = parsePagination(query);
    const where: Prisma.UserWhereInput = { organizationId: orgId };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true, avatarUrl: true },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
      }),
      prisma.user.count({ where }),
    ]);

    return paginatedResult(data, total, pagination);
  },

  async updateRole(orgId: string, userId: string, role: string) {
    const user = await prisma.user.findFirst({ where: { id: userId, organizationId: orgId } });
    if (!user) throw AppError.notFound('User not found');

    return prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
      select: { id: true, name: true, email: true, role: true },
    });
  },

  async deactivate(orgId: string, userId: string) {
    const user = await prisma.user.findFirst({ where: { id: userId, organizationId: orgId } });
    if (!user) throw AppError.notFound('User not found');

    return prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  },
};
