import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export type {
  Prisma,
  Organization,
  OrganizationMember,
  OrganizationRole,
  User,
  Role,
  RolePermission,
  Category,
  Product,
  ProductVariant,
  ProductSupplier,
  ProductStatus,
  Supplier,
  SupplierStatus,
  Customer,
  Warehouse,
  WarehouseZone,
  WarehouseBin,
  StockLevel,
  StockMovement,
  StockMovementType,
  PurchaseOrder,
  PurchaseOrderStatus,
  PurchaseOrderItem,
  SalesOrder,
  SalesOrderStatus,
  SalesOrderItem,
  AuditLog,
} from '@prisma/client';

export { PrismaClient } from '@prisma/client';
