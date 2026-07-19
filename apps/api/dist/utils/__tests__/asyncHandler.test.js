"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const asyncHandler_1 = require("../asyncHandler");
describe('asyncHandler', () => {
    it('should call the handler and resolve successfully', async () => {
        const handler = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
            res.json({ ok: true });
        });
        const req = {};
        const res = { json: jest.fn() };
        const next = jest.fn();
        await handler(req, res, next);
        expect(res.json).toHaveBeenCalledWith({ ok: true });
        expect(next).not.toHaveBeenCalled();
    });
    it('should catch errors and forward to next', async () => {
        const error = new Error('test error');
        const handler = (0, asyncHandler_1.asyncHandler)(async (_req, _res, _next) => {
            throw error;
        });
        const req = {};
        const res = {};
        const next = jest.fn();
        await handler(req, res, next);
        expect(next).toHaveBeenCalledWith(error);
    });
});
//# sourceMappingURL=asyncHandler.test.js.map