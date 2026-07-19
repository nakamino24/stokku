"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    constructor(statusCode, message, code, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
    static badRequest(message, details) {
        return new AppError(400, message, 'BAD_REQUEST', details);
    }
    static unauthorized(message = 'Unauthorized') {
        return new AppError(401, message, 'UNAUTHORIZED');
    }
    static forbidden(message = 'Forbidden') {
        return new AppError(403, message, 'FORBIDDEN');
    }
    static notFound(message = 'Resource not found') {
        return new AppError(404, message, 'NOT_FOUND');
    }
    static conflict(message) {
        return new AppError(409, message, 'CONFLICT');
    }
    static internal(message = 'Internal server error') {
        return new AppError(500, message, 'INTERNAL_ERROR');
    }
}
exports.AppError = AppError;
//# sourceMappingURL=errors.js.map