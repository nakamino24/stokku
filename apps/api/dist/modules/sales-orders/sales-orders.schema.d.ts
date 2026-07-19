import { z } from 'zod';
export declare const createSalesOrderSchema: z.ZodObject<{
    customerId: z.ZodString;
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
    items: {
        quantity: number;
        unitPrice: number;
        productId: string;
        variantId?: string | undefined;
    }[];
    customerId: string;
    notes?: string | undefined;
    taxRate?: number | undefined;
}, {
    items: {
        quantity: number;
        unitPrice: number;
        productId: string;
        variantId?: string | undefined;
    }[];
    customerId: string;
    notes?: string | undefined;
    taxRate?: number | undefined;
}>;
export declare const updateSalesOrderStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["DRAFT", "CONFIRMED", "PICKING", "SHIPPING", "DELIVERED", "CANCELLED", "RETURNED"]>;
}, "strip", z.ZodTypeAny, {
    status: "DRAFT" | "CANCELLED" | "CONFIRMED" | "PICKING" | "SHIPPING" | "DELIVERED" | "RETURNED";
}, {
    status: "DRAFT" | "CANCELLED" | "CONFIRMED" | "PICKING" | "SHIPPING" | "DELIVERED" | "RETURNED";
}>;
//# sourceMappingURL=sales-orders.schema.d.ts.map