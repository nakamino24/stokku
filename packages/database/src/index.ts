import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

function buildConnectionUrl(): string | undefined {
  const base = process.env.DATABASE_URL;
  if (!base) return undefined;

  // Neon (and most serverless Postgres) benefit from a bounded pool.
  // Append pooling parameters so each serverless invocation reuses the
  // connection pooler instead of opening a fresh TCP connection.
  try {
    const url = new URL(base);
    const params = url.searchParams;
    if (!params.has('connection_limit')) params.set('connection_limit', '5');
    if (!params.has('pool_timeout')) params.set('pool_timeout', '20');
    const isLocalDatabase = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
    if (!isLocalDatabase && !params.has('sslmode')) params.set('sslmode', 'require');
    return url.toString();
  } catch {
    return base;
  }
}

function createPrismaClient(): PrismaClient {
  const isServerless = !!process.env.VERCEL;
  const connectionUrl = buildConnectionUrl();

  if (!connectionUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  return new PrismaClient({
    log: !isServerless && process.env.NODE_ENV === 'development'
      ? ['query', 'warn', 'error']
      : ['error'],
    datasources: {
      db: { url: connectionUrl },
    },
  });
}

export const prisma =
  global.prisma ||
  createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export {
  Prisma,
  PrismaClient,
  OrganizationRole,
  SupplierStatus,
  ProductStatus,
  StockMovementType,
  InventoryStatus,
  InventoryAllocationStatus,
  GoodsReceiptStatus,
  AdjustmentReasonCode,
  DocumentType,
  PurchaseOrderStatus,
  SalesOrderStatus,
} from '@prisma/client';

export type {
  Organization,
  OrganizationMember,
  User,
  Role,
  RolePermission,
  Category,
  Product,
  ProductVariant,
  ProductSupplier,
  Supplier,
  Customer,
  Warehouse,
  WarehouseZone,
  WarehouseBin,
  StockLevel,
  StockMovement,
  InventoryAllocation,
  GoodsReceipt,
  GoodsReceiptLine,
  DocumentSequence,
  PurchaseOrder,
  PurchaseOrderItem,
  SalesOrder,
  SalesOrderItem,
  AuditLog,
} from '@prisma/client';
