export declare const DashboardService: {
    getSummary(orgId: string): Promise<{
        stats: {
            products: number;
            suppliers: number;
            customers: number;
            warehouses: number;
            totalStock: number;
            pendingPO: number;
            pendingSO: number;
            lowStockAlerts: number;
        };
        recentMovements: (import("@stokku/database").StockMovement & {
            product: {
                name: string;
            };
            warehouse: {
                name: string;
            } | null;
            createdBy: {
                name: string;
            };
        })[];
    }>;
    getLowStockAlerts(orgId: string): Promise<(import("@stokku/database").StockLevel & {
        product: {
            name: string;
            sku: string | null;
            unit: string;
        };
        warehouse: {
            name: string;
        };
    })[]>;
};
//# sourceMappingURL=dashboard.service.d.ts.map