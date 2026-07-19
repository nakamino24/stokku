import { z } from 'zod';
export declare const createPurchaseOrderSchema: z.ZodObject<{
    supplierId: z.ZodString;
    expectedDate: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    taxRate: z.ZodOptional<z.ZodNumber>;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        variantId: z.ZodOptional<z.ZodString>;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        quantity: number;
        unitPrice: number;
        productId: string;
        variantId?: string | undefined;
    }, {
        quantity: number;
        unitPrice: number;
        productId: string;
        variantId?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    supplierId: string;
    items: {
        quantity: number;
        unitPrice: number;
        productId: string;
        variantId?: string | undefined;
    }[];
    expectedDate?: string | undefined;
    notes?: string | undefined;
    taxRate?: number | undefined;
}, {
    supplierId: string;
    items: {
        quantity: number;
        unitPrice: number;
        productId: string;
        variantId?: string | undefined;
    }[];
    expectedDate?: string | undefined;
    notes?: string | undefined;
    taxRate?: number | undefined;
}>;
export declare const updatePurchaseOrderStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["DRAFT", "PENDING_APPROVAL", "APPROVED", "SENT", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"]>;
}, "strip", z.ZodTypeAny, {
    status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "SENT" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED";
}, {
    status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "SENT" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED";
}>;
export declare const receivePurchaseOrderSchema: z.ZodObject<{
    warehouseId: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        itemId: z.ZodString;
        receivedQty: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        receivedQty: number;
        itemId: string;
    }, {
        receivedQty: number;
        itemId: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    warehouseId: string;
    items: {
        receivedQty: number;
        itemId: string;
    }[];
}, {
    warehouseId: string;
    items: {
        receivedQty: number;
        itemId: string;
    }[];
}>;
//# sourceMappingURL=purchase-orders.schema.d.ts.map