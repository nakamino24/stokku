"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const errorHandler = (err, _req, res, _next) => {
    if (err instanceof errors_1.AppError) {
        res.status(err.statusCode).json({
            error: err.message,
            code: err.code,
            ...(err.details ? { details: err.details } : {}),
        });
        return;
    }
    logger_1.logger.error('Unhandled error', {
        message: err.message,
        stack: err.stack,
        name: err.name,
    });
    res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map