export declare const SupplierService: {
    list(orgId: string, query: Record<string, any>): Promise<import("../../utils/pagination").PaginatedResult<import("@stokku/database").Supplier & {
        _count: {
            products: number;
            purchaseOrders: number;
        };
    }>>;
    getById(orgId: string, id: string): Promise<import("@stokku/database").Supplier & {
        products: (import("@stokku/database").ProductSupplier & {
            product: import("@stokku/database").Product & {
                category: import("@stokku/database").Category | null;
            };
        })[];
        purchaseOrders: import("@stokku/database").PurchaseOrder[];
    }>;
    create(orgId: string, data: any): Promise<import("@stokku/database").Supplier>;
    update(orgId: string, id: string, data: any): Promise<import("@stokku/database").Supplier>;
    delete(orgId: string, id: string): Promise<void>;
};
//# sourceMappingURL=suppliers.service.d.ts.map