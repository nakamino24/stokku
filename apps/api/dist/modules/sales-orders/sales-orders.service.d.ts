import { SalesOrderStatus } from '@stokku/database';
export declare const SalesOrderService: {
    list(orgId: string, query: Record<string, any>): Promise<import("../../utils/pagination").PaginatedResult<import("@stokku/database").SalesOrder & {
        createdBy: {
            name: string;
        };
        items: (import("@stokku/database").SalesOrderItem & {
            product: {
                name: string;
                sku: string | null;
                unit: string;
            };
            variant: {
                name: string;
                sku: string | null;
            } | null;
        })[];
        customer: import("@stokku/database").Customer;
    }>>;
    getById(orgId: string, id: string): Promise<import("@stokku/database").SalesOrder & {
        createdBy: {
            name: string;
        };
        items: (import("@stokku/database").SalesOrderItem & {
            product: {
                name: string;
                sku: string | null;
                unit: string;
            };
            variant: {
                name: string;
                sku: string | null;
            } | null;
        })[];
        customer: import("@stokku/database").Customer;
    }>;
    create(orgId: string, userId: string, data: any): Promise<any>;
    updateStatus(orgId: string, userId: string, id: string, status: SalesOrderStatus): Promise<any>;
};
//# sourceMappingURL=sales-orders.service.d.ts.map