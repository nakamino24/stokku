"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorHandler_1 = require("../errorHandler");
const errors_1 = require("../../utils/errors");
describe('errorHandler', () => {
    let req;
    let res;
    let next;
    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        next = jest.fn();
    });
    it('should handle AppError with status and code', () => {
        const err = errors_1.AppError.badRequest('Invalid input', { field: 'email' });
        (0, errorHandler_1.errorHandler)(err, req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Invalid input',
            code: 'BAD_REQUEST',
            details: { field: 'email' },
        });
    });
    it('should handle unauthorized error', () => {
        const err = errors_1.AppError.unauthorized('Login required');
        (0, errorHandler_1.errorHandler)(err, req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Login required',
            code: 'UNAUTHORIZED',
        });
    });
    it('should handle forbidden error', () => {
        const err = errors_1.AppError.forbidden('Access denied');
        (0, errorHandler_1.errorHandler)(err, req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
    });
    it('should handle not found error', () => {
        const err = errors_1.AppError.notFound('Resource not found');
        (0, errorHandler_1.errorHandler)(err, req, res, next);
        expect(res.status).toHaveBeenCalledWith(404);
    });
    it('should handle conflict error', () => {
        const err = errors_1.AppError.conflict('Duplicate entry');
        (0, errorHandler_1.errorHandler)(err, req, res, next);
        expect(res.status).toHaveBeenCalledWith(409);
    });
    it('should handle internal error', () => {
        const err = errors_1.AppError.internal('Something broke');
        (0, errorHandler_1.errorHandler)(err, req, res, next);
        expect(res.status).toHaveBeenCalledWith(500);
    });
    it('should return 500 for unknown errors', () => {
        const err = new Error('Unexpected error');
        (0, errorHandler_1.errorHandler)(err, req, res, next);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Internal server error',
            code: 'INTERNAL_ERROR',
        });
    });
});
//# sourceMappingURL=errorHandler.test.js.map