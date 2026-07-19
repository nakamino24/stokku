export declare const RolesService: {
    list(orgId: string): Promise<(import("@stokku/database").Role & {
        permissions: import("@stokku/database").RolePermission[];
    })[]>;
    create(orgId: string, data: {
        name: string;
        slug: string;
        description?: string;
        permissions: string[];
    }): Promise<import("@stokku/database").Role & {
        permissions: import("@stokku/database").RolePermission[];
    }>;
    update(orgId: string, id: string, data: {
        name?: string;
        description?: string;
        permissions?: string[];
    }): Promise<import("@stokku/database").Role & {
        permissions: import("@stokku/database").RolePermission[];
    }>;
    delete(orgId: string, id: string): Promise<void>;
};
//# sourceMappingURL=roles.service.d.ts.map