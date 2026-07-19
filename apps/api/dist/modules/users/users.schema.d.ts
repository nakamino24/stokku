import { z } from 'zod';
export declare const updateUserRoleSchema: z.ZodObject<{
    role: z.ZodEnum<["OWNER", "ADMIN", "INVENTORY_MANAGER", "WAREHOUSE_STAFF", "CASHIER", "VIEWER"]>;
}, "strip", z.ZodTypeAny, {
    role: "OWNER" | "ADMIN" | "INVENTORY_MANAGER" | "WAREHOUSE_STAFF" | "CASHIER" | "VIEWER";
}, {
    role: "OWNER" | "ADMIN" | "INVENTORY_MANAGER" | "WAREHOUSE_STAFF" | "CASHIER" | "VIEWER";
}>;
//# sourceMappingURL=users.schema.d.ts.map