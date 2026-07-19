export declare const CategoryService: {
    list(orgId: string): Promise<(import("@stokku/database").Category & {
        _count: {
            products: number;
        };
        children: (import("@stokku/database").Category & {
            _count: {
                products: number;
            };
        })[];
    })[]>;
    getById(orgId: string, id: string): Promise<import("@stokku/database").Category & {
        _count: {
            products: number;
        };
        children: import("@stokku/database").Category[];
        parent: import("@stokku/database").Category | null;
    }>;
    create(orgId: string, data: {
        name: string;
        slug?: string;
        description?: string;
        parentId?: string;
        color?: string;
        sortOrder?: number;
    }): Promise<import("@stokku/database").Category>;
    update(orgId: string, id: string, data: any): Promise<import("@stokku/database").Category>;
    delete(orgId: string, id: string): Promise<void>;
};
//# sourceMappingURL=categories.service.d.ts.map