import { PrismaClient } from '@prisma/client';
declare global {
    var prisma: PrismaClient | undefined;
}
export declare const prisma: PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export type { Prisma, Organization, OrganizationMember, OrganizationRole, User, Role, RolePermission, Category, Product, ProductVariant, ProductSupplier, ProductStatus, Supplier, SupplierStatus, Customer, Warehouse, WarehouseZone, WarehouseBin, StockLevel, StockMovement, StockMovementType, PurchaseOrder, PurchaseOrderStatus, PurchaseOrderItem, SalesOrder, SalesOrderStatus, SalesOrderItem, AuditLog, } from '@prisma/client';
export { PrismaClient } from '@prisma/client';
