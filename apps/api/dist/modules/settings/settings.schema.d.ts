import { z } from 'zod';
export declare const updateOrganizationSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    currency: z.ZodOptional<z.ZodString>;
    timezone: z.ZodOptional<z.ZodString>;
    language: z.ZodOptional<z.ZodString>;
    dateFormat: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    currency?: string | undefined;
    timezone?: string | undefined;
    language?: string | undefined;
    dateFormat?: string | undefined;
}, {
    name?: string | undefined;
    currency?: string | undefined;
    timezone?: string | undefined;
    language?: string | undefined;
    dateFormat?: string | undefined;
}>;
//# sourceMappingURL=settings.schema.d.ts.map