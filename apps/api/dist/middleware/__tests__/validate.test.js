"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const validate_1 = require("../validate");
const testSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    age: zod_1.z.number().int().positive().optional(),
});
describe('validate middleware', () => {
    let req;
    let res;
    let next;
    beforeEach(() => {
        req = { body: {} };
        res = {};
        next = jest.fn();
    });
    it('should pass validation and call next', () => {
        req.body = { name: 'Test', age: 25 };
        (0, validate_1.validate)({ body: testSchema })(req, res, next);
        expect(next).toHaveBeenCalledWith();
    });
    it('should call next with AppError 400 for invalid body', () => {
        req.body = { name: '' };
        (0, validate_1.validate)({ body: testSchema })(req, res, next);
        expect(next).toHaveBeenCalled();
        const err = next.mock.calls[0][0];
        expect(err.statusCode).toBe(400);
        expect(err.code).toBe('BAD_REQUEST');
    });
    it('should call next with AppError 400 for missing required field', () => {
        req.body = {};
        (0, validate_1.validate)({ body: testSchema })(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});
//# sourceMappingURL=validate.test.js.map