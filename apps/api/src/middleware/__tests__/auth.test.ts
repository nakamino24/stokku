import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../auth';
import { AppError } from '../../utils/errors';

jest.mock('@stokku/database', () => ({ prisma: {} }));

jest.mock('../../config', () => ({
  config: { jwt: { accessSecret: 'test-access-secret-min-16-chars' } },
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

describe('authMiddleware', () => {
  let req: Request;
  let res: Response;
  let next: jest.Mock;

  beforeEach(() => {
    req = { headers: {} } as Request;
    res = {} as Response;
    next = jest.fn();
  });

  it('should call next with 401 when no token', () => {
    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(401);
  });

  it('should call next with 401 for malformed header', () => {
    req.headers = { authorization: 'Bearer' };

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(401);
  });

  it('should call next with 401 for invalid token', () => {
    req.headers = { authorization: 'Bearer invalid-token' };
    const jwt = jest.requireMock('jsonwebtoken');
    (jwt.verify as jest.Mock).mockImplementation(() => { throw { name: 'JsonWebTokenError' }; });

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(401);
  });

  it('should set req.user for valid token', () => {
    req.headers = { authorization: 'Bearer valid-token' };
    const jwt = jest.requireMock('jsonwebtoken');
    const payload = { id: 'user-1', email: 'test@test.com', name: 'Test', role: 'ADMIN', organizationId: 'org-1', organizationSlug: 'test-org' };
    (jwt.verify as jest.Mock).mockReturnValue(payload);

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect((req as any).user).toEqual(payload);
  });
});
