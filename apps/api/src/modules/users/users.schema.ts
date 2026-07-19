import { z } from 'zod';

export const updateUserRoleSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF', 'CASHIER', 'VIEWER']),
});
