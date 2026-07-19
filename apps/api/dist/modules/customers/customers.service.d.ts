export declare const CustomerService: {
    list(orgId: string, query: Record<string, any>): Promise<import("../../utils/pagination").PaginatedResult<import("@stokku/database").Customer & {
        _count: {
            salesOrders: number;
        };
    }>>;
    getById(orgId: string, id: string): Promise<import("@stokku/database").Customer & {
        salesOrders: import("@stokku/database").SalesOrder[];
    }>;
    create(orgId: string, data: any): Promise<import("@stokku/database").Customer>;
    update(orgId: string, id: string, data: any): Promise<import("@stokku/database").Customer>;
    delete(orgId: string, id: string): Promise<void>;
};
//# sourceMappingURL=customers.service.d.ts.map