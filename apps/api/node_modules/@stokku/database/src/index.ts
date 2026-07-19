import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export type { Prisma, User, Project, Task, Workspace, WorkspaceMember, Comment, Attachment, Notification, Category, Product, ProductVariant, ProductSupplier, Supplier, Warehouse, StockLevel, StockMovement } from '@prisma/client';
export { PrismaClient } from '@prisma/client';
