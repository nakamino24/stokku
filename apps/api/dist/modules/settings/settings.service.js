"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const database_1 = require("@stokku/database");
const errors_1 = require("../../utils/errors");
exports.SettingsService = {
    async getOrganization(orgId) {
        const org = await database_1.prisma.organization.findUnique({
            where: { id: orgId },
            select: {
                id: true, name: true, slug: true, email: true, phone: true,
                address: true, city: true, country: true, currency: true,
                timezone: true, logoUrl: true,
            },
        });
        if (!org)
            throw errors_1.AppError.notFound('Organization not found');
        return org;
    },
    async updateOrganization(orgId, data) {
        return database_1.prisma.organization.update({
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
//# sourceMappingURL=settings.service.js.map