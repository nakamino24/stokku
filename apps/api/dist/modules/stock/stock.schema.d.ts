import { z } from 'zod';
export declare const adjustStockSchema: z.ZodObject<{
    productId: z.ZodString;
    variantId: z.ZodOptional<z.ZodString>;
    warehouseId: z.ZodString;
    quantity: z.ZodEffects<z.ZodNumber, number, number>;
    reason: z.ZodOptional<z.ZodString>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    quantity: number;
    warehouseId: string;
    productId: string;
    variantId?: string | undefined;
    reason?: string | undefined;
    note?: string | undefined;
}, {
    quantity: number;
    warehouseId: string;
    productId: string;
    variantId?: string | undefined;
    reason?: string | undefined;
    note?: string | undefined;
}>;
export declare const transferStockSchema: z.ZodObject<{
    productId: z.ZodString;
    variantId: z.ZodOptional<z.ZodString>;
    fromWarehouseId: z.ZodString;
    toWarehouseId: z.ZodString;
    quantity: z.ZodNumber;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    quantity: number;
    productId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    variantId?: string | undefined;
    note?: string | undefined;
}, {
    quantity: number;
    productId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    variantId?: string | undefined;
    note?: string | undefined;
}>;
//# sourceMappingURL=stock.schema.d.ts.map