export declare const StockService: {
    list(orgId: string, query: Record<string, any>): Promise<import("../../utils/pagination").PaginatedResult<import("@stokku/database").StockLevel & {
        product: {
            name: string;
            sku: string | null;
            unit: string;
        };
        warehouse: {
            name: string;
            code: string;
        };
        variant: {
            name: string;
            sku: string | null;
        } | null;
    }>>;
    getMovements(orgId: string, query: Record<string, any>): Promise<import("../../utils/pagination").PaginatedResult<import("@stokku/database").StockMovement & {
        product: {
            name: string;
            sku: string | null;
        };
        warehouse: {
            name: string;
        } | null;
        createdBy: {
            name: string;
        };
        variant: {
            name: string;
        } | null;
    }>>;
    adjust(orgId: string, userId: string, data: {
        productId: string;
        variantId?: string;
        warehouseId: string;
        quantity: number;
        reason?: string;
        note?: string;
    }): Promise<any>;
    transfer(orgId: string, userId: string, data: {
        productId: string;
        variantId?: string;
        fromWarehouseId: string;
        toWarehouseId: string;
        quantity: number;
        note?: string;
    }): Promise<any>;
};
//# sourceMappingURL=stock.service.d.ts.map