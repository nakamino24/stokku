"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../auth");
jest.mock('@stokku/database', () => ({ prisma: {} }));
jest.mock('../../config', () => ({
    config: { jwt: { accessSecret: 'test-access-secret-min-16-chars' } },
}));
jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(),
}));
describe('authMiddleware', () => {
    let req;
    let res;
    let next;
    beforeEach(() => {
        req = { headers: {} };
        res = {};
        next = jest.fn();
    });
    it('should call next with 401 when no token', () => {
        (0, auth_1.authMiddleware)(req, res, next);
        expect(next).toHaveBeenCalled();
        const err = next.mock.calls[0][0];
        expect(err.statusCode).toBe(401);
    });
    it('should call next with 401 for malformed header', () => {
        req.headers = { authorization: 'Bearer' };
        (0, auth_1.authMiddleware)(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0].statusCode).toBe(401);
    });
    it('should call next with 401 for invalid token', () => {
        req.headers = { authorization: 'Bearer invalid-token' };
        const jwt = jest.requireMock('jsonwebtoken');
        jwt.verify.mockImplementation(() => { throw { name: 'JsonWebTokenError' }; });
        (0, auth_1.authMiddleware)(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0].statusCode).toBe(401);
    });
    it('should set req.user for valid token', () => {
        req.headers = { authorization: 'Bearer valid-token' };
        const jwt = jest.requireMock('jsonwebtoken');
        const payload = { id: 'user-1', email: 'test@test.com', name: 'Test', role: 'ADMIN', organizationId: 'org-1', organizationSlug: 'test-org' };
        jwt.verify.mockReturnValue(payload);
        (0, auth_1.authMiddleware)(req, res, next);
        expect(next).toHaveBeenCalledWith();
        expect(req.user).toEqual(payload);
    });
});
//# sourceMappingURL=auth.test.js.map