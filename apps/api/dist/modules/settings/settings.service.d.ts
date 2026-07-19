export declare const SettingsService: {
    getOrganization(orgId: string): Promise<{
        id: string;
        email: string | null;
        name: string;
        phone: string | null;
        slug: string;
        address: string | null;
        city: string | null;
        country: string | null;
        currency: string;
        timezone: string;
        logoUrl: string | null;
    }>;
    updateOrganization(orgId: string, data: any): Promise<{
        id: string;
        email: string | null;
        name: string;
        phone: string | null;
        slug: string;
        address: string | null;
        city: string | null;
        country: string | null;
        currency: string;
        timezone: string;
        logoUrl: string | null;
    }>;
};
//# sourceMappingURL=settings.service.d.ts.map