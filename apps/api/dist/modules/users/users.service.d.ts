export declare const UsersService: {
    list(orgId: string, query: Record<string, any>): Promise<import("../../utils/pagination").PaginatedResult<{
        id: string;
        email: string;
        name: string;
        role: import("@stokku/database").OrganizationRole;
        isActive: boolean;
        avatarUrl: string | null;
        lastLoginAt: Date | null;
        createdAt: Date;
    }>>;
    updateRole(orgId: string, userId: string, role: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@stokku/database").OrganizationRole;
    }>;
    deactivate(orgId: string, userId: string): Promise<import("@stokku/database").User>;
};
//# sourceMappingURL=users.service.d.ts.map