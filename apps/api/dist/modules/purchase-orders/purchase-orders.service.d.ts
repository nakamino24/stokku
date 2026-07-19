import { PurchaseOrderStatus } from '@stokku/database';
export declare const PurchaseOrderService: {
    list(orgId: string, query: Record<string, any>): Promise<import("../../utils/pagination").PaginatedResult<import("@stokku/database").PurchaseOrder & {
        createdBy: {
            name: string;
        };
        supplier: import("@stokku/database").Supplier;
        items: (import("@stokku/database").PurchaseOrderItem & {
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
    }>>;
    getById(orgId: string, id: string): Promise<import("@stokku/database").PurchaseOrder & {
        createdBy: {
            name: string;
        };
        supplier: import("@stokku/database").Supplier;
        items: (import("@stokku/database").PurchaseOrderItem & {
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
    }>;
    create(orgId: string, userId: string, data: any): Promise<import("@stokku/database").PurchaseOrder & {
        createdBy: {
            name: string;
        };
        supplier: import("@stokku/database").Supplier;
        items: (import("@stokku/database").PurchaseOrderItem & {
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
    }>;
    updateStatus(orgId: string, userId: string, id: string, status: PurchaseOrderStatus): Promise<import("@stokku/database").PurchaseOrder & {
        createdBy: {
            name: string;
        };
        supplier: import("@stokku/database").Supplier;
        items: (import("@stokku/database").PurchaseOrderItem & {
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
    }>;
    receive(orgId: string, userId: string, warehouseId: string, id: string, items: {
        itemId: string;
        receivedQty: number;
    }[]): Promise<any>;
};
//# sourceMappingURL=purchase-orders.service.d.ts.map