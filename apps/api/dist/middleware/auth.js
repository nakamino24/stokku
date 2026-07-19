"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_1 = require("../utils/errors");
const config_1 = require("../config");
const authMiddleware = (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw errors_1.AppError.unauthorized('Access token required');
        }
        const token = authHeader.split(' ')[1];
        const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwt.accessSecret);
        req.user = {
            id: payload.id,
            email: payload.email,
            name: payload.name,
            role: payload.role,
            organizationId: payload.organizationId,
            organizationSlug: payload.organizationSlug,
        };
        next();
    }
    catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            next(errors_1.AppError.unauthorized('Invalid or expired token'));
        }
        else {
            next(error);
        }
    }
};
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=auth.js.map