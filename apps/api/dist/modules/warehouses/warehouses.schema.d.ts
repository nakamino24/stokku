import { z } from 'zod';
export declare const createWarehouseSchema: z.ZodObject<{
    name: z.ZodString;
    code: z.ZodString;
    address: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    code: string;
    address?: string | undefined;
    isActive?: boolean | undefined;
}, {
    name: string;
    code: string;
    address?: string | undefined;
    isActive?: boolean | undefined;
}>;
export declare const updateWarehouseSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    code: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    code?: string | undefined;
    address?: string | undefined;
    isActive?: boolean | undefined;
}, {
    name?: string | undefined;
    code?: string | undefined;
    address?: string | undefined;
    isActive?: boolean | undefined;
}>;
export declare const createZoneSchema: z.ZodObject<{
    name: z.ZodString;
    code: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    code: string;
    description?: string | undefined;
}, {
    name: string;
    code: string;
    description?: string | undefined;
}>;
export declare const createBinSchema: z.ZodObject<{
    name: z.ZodString;
    code: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    maxCapacity: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    code: string;
    description?: string | undefined;
    maxCapacity?: number | undefined;
}, {
    name: string;
    code: string;
    description?: string | undefined;
    maxCapacity?: number | undefined;
}>;
//# sourceMappingURL=warehouses.schema.d.ts.map