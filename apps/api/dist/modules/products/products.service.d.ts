export declare const ProductService: {
    list(orgId: string, query: Record<string, any>): Promise<import("../../utils/pagination").PaginatedResult<import("@stokku/database").Product & {
        _count: {
            stockLevels: number;
            movements: number;
        };
        category: import("@stokku/database").Category | null;
        variants: import("@stokku/database").ProductVariant[];
        suppliers: (import("@stokku/database").ProductSupplier & {
            supplier: import("@stokku/database").Supplier;
        })[];
    }>>;
    getById(orgId: string, id: string): Promise<import("@stokku/database").Product & {
        _count: {
            stockLevels: number;
            movements: number;
        };
        stockLevels: (import("@stokku/database").StockLevel & {
            warehouse: import("@stokku/database").Warehouse;
        })[];
        movements: (import("@stokku/database").StockMovement & {
            warehouse: import("@stokku/database").Warehouse | null;
            createdBy: {
                name: string;
            };
        })[];
        category: import("@stokku/database").Category | null;
        variants: import("@stokku/database").ProductVariant[];
        suppliers: (import("@stokku/database").ProductSupplier & {
            supplier: import("@stokku/database").Supplier;
        })[];
    }>;
    create(orgId: string, userId: string, data: any): Promise<import("@stokku/database").Product & {
        _count: {
            stockLevels: number;
            movements: number;
        };
        category: import("@stokku/database").Category | null;
        variants: import("@stokku/database").ProductVariant[];
        suppliers: (import("@stokku/database").ProductSupplier & {
            supplier: import("@stokku/database").Supplier;
        })[];
    }>;
    update(orgId: string, userId: string, id: string, data: any): Promise<import("@stokku/database").Product & {
        _count: {
            stockLevels: number;
            movements: number;
        };
        category: import("@stokku/database").Category | null;
        variants: import("@stokku/database").ProductVariant[];
        suppliers: (import("@stokku/database").ProductSupplier & {
            supplier: import("@stokku/database").Supplier;
        })[];
    }>;
    delete(orgId: string, userId: string, id: string): Promise<void>;
};
//# sourceMappingURL=products.service.d.ts.map