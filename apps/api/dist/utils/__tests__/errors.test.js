"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../errors");
describe('AppError', () => {
    it('should create a bad request error with status 400', () => {
        const err = errors_1.AppError.badRequest('Invalid input');
        expect(err).toBeInstanceOf(errors_1.AppError);
        expect(err.statusCode).toBe(400);
        expect(err.message).toBe('Invalid input');
        expect(err.code).toBe('BAD_REQUEST');
    });
    it('should create a bad request error with details', () => {
        const details = { field: 'email', error: 'required' };
        const err = errors_1.AppError.badRequest('Invalid input', details);
        expect(err.statusCode).toBe(400);
        expect(err.details).toEqual(details);
    });
    it('should create an unauthorized error with default message', () => {
        const err = errors_1.AppError.unauthorized();
        expect(err.statusCode).toBe(401);
        expect(err.message).toBe('Unauthorized');
        expect(err.code).toBe('UNAUTHORIZED');
    });
    it('should create a forbidden error with custom message', () => {
        const err = errors_1.AppError.forbidden('Access denied');
        expect(err.statusCode).toBe(403);
        expect(err.message).toBe('Access denied');
    });
    it('should create a not found error with default message', () => {
        const err = errors_1.AppError.notFound();
        expect(err.statusCode).toBe(404);
        expect(err.message).toBe('Resource not found');
    });
    it('should create a not found error with custom message', () => {
        const err = errors_1.AppError.notFound('Product not found');
        expect(err.statusCode).toBe(404);
        expect(err.message).toBe('Product not found');
    });
    it('should create a conflict error', () => {
        const err = errors_1.AppError.conflict('Email already exists');
        expect(err.statusCode).toBe(409);
        expect(err.message).toBe('Email already exists');
        expect(err.code).toBe('CONFLICT');
    });
    it('should create an internal error with default message', () => {
        const err = errors_1.AppError.internal();
        expect(err.statusCode).toBe(500);
        expect(err.message).toBe('Internal server error');
    });
    it('should preserve stack trace', () => {
        const err = errors_1.AppError.badRequest('test');
        expect(err.stack).toBeDefined();
        expect(err.name).toBe('AppError');
    });
});
//# sourceMappingURL=errors.test.js.map