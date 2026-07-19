export declare const WarehouseService: {
    list(orgId: string): Promise<(import("@stokku/database").Warehouse & {
        _count: {
            stockLevels: number;
        };
        zones: (import("@stokku/database").WarehouseZone & {
            bins: import("@stokku/database").WarehouseBin[];
        })[];
    })[]>;
    getById(orgId: string, id: string): Promise<import("@stokku/database").Warehouse & {
        stockLevels: (import("@stokku/database").StockLevel & {
            product: {
                name: string;
                sku: string | null;
            };
            variant: {
                name: string;
                sku: string | null;
            } | null;
        })[];
        zones: (import("@stokku/database").WarehouseZone & {
            bins: import("@stokku/database").WarehouseBin[];
        })[];
    }>;
    create(orgId: string, data: any): Promise<import("@stokku/database").Warehouse>;
    update(orgId: string, id: string, data: any): Promise<import("@stokku/database").Warehouse>;
    delete(orgId: string, id: string): Promise<void>;
    createZone(orgId: string, warehouseId: string, data: {
        name: string;
        code: string;
        description?: string;
    }): Promise<import("@stokku/database").WarehouseZone>;
    createBin(orgId: string, zoneId: string, data: {
        code: string;
        maxCapacity?: number;
        description?: string;
    }): Promise<import("@stokku/database").WarehouseBin>;
};
//# sourceMappingURL=warehouses.service.d.ts.map