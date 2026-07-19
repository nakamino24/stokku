import { z } from 'zod';
export declare const createRoleSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    slug: string;
    description?: string | undefined;
    permissions?: string[] | undefined;
}, {
    name: string;
    slug: string;
    description?: string | undefined;
    permissions?: string[] | undefined;
}>;
export declare const updateRoleSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    slug?: string | undefined;
    description?: string | undefined;
    permissions?: string[] | undefined;
}, {
    name?: string | undefined;
    slug?: string | undefined;
    description?: string | undefined;
    permissions?: string[] | undefined;
}>;
//# sourceMappingURL=roles.schema.d.ts.map