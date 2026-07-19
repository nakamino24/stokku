import { prisma } from '@stokku/database';
import { AppError } from '../../utils/errors';

export const SettingsService = {
  async getOrganization(orgId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true, name: true, slug: true, email: true, phone: true,
        address: true, city: true, country: true, currency: true,
        timezone: true, logoUrl: true,
      },
    });
    if (!org) throw AppError.notFound('Organization not found');
    return org;
  },

  async updateOrganization(orgId: string, data: any) {
    return prisma.organization.update({
      where: { id: orgId },
      data,
      select: {
        id: true, name: true, slug: true, email: true, phone: true,
        address: true, city: true, country: true, currency: true,
        timezone: true, logoUrl: true,
      },
    });
  },
};
