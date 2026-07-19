import { z } from 'zod';
export declare const createSupplierSchema: z.ZodObject<{
    name: z.ZodString;
    contactPerson: z.ZodOptional<z.ZodString>;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    taxId: z.ZodOptional<z.ZodString>;
    paymentTerms: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    contactPerson?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    taxId?: string | undefined;
    paymentTerms?: string | undefined;
    notes?: string | undefined;
}, {
    name: string;
    contactPerson?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    taxId?: string | undefined;
    paymentTerms?: string | undefined;
    notes?: string | undefined;
}>;
export declare const updateSupplierSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    contactPerson: z.ZodOptional<z.ZodString>;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    taxId: z.ZodOptional<z.ZodString>;
    paymentTerms: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    contactPerson?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    taxId?: string | undefined;
    paymentTerms?: string | undefined;
    notes?: string | undefined;
}, {
    name?: string | undefined;
    contactPerson?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    taxId?: string | undefined;
    paymentTerms?: string | undefined;
    notes?: string | undefined;
}>;
//# sourceMappingURL=suppliers.schema.d.ts.map