import { z } from 'zod';
export declare const createCustomerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    taxId: z.ZodOptional<z.ZodString>;
    creditLimit: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    taxId?: string | undefined;
    creditLimit?: number | undefined;
    notes?: string | undefined;
}, {
    name: string;
    email?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    taxId?: string | undefined;
    creditLimit?: number | undefined;
    notes?: string | undefined;
}>;
export declare const updateCustomerSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    taxId: z.ZodOptional<z.ZodString>;
    creditLimit: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    taxId?: string | undefined;
    creditLimit?: number | undefined;
    notes?: string | undefined;
}, {
    name?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    taxId?: string | undefined;
    creditLimit?: number | undefined;
    notes?: string | undefined;
}>;
//# sourceMappingURL=customers.schema.d.ts.map