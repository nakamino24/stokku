export declare class AppError extends Error {
    statusCode: number;
    code?: string | undefined;
    details?: unknown;
    constructor(statusCode: number, message: string, code?: string | undefined, details?: unknown);
    static badRequest(message: string, details?: unknown): AppError;
    static unauthorized(message?: string): AppError;
    static forbidden(message?: string): AppError;
    static notFound(message?: string): AppError;
    static conflict(message: string): AppError;
    static internal(message?: string): AppError;
}
//# sourceMappingURL=errors.d.ts.map