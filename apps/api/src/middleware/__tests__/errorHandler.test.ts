import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../errorHandler';
import { AppError } from '../../utils/errors';

describe('errorHandler', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = {} as Request;
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    next = jest.fn();
  });

  it('should handle AppError with status and code', () => {
    const err = AppError.badRequest('Invalid input', { field: 'email' });

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid input',
      code: 'BAD_REQUEST',
      details: { field: 'email' },
    });
  });

  it('should handle unauthorized error', () => {
    const err = AppError.unauthorized('Login required');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Login required',
      code: 'UNAUTHORIZED',
    });
  });

  it('should handle forbidden error', () => {
    const err = AppError.forbidden('Access denied');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should handle not found error', () => {
    const err = AppError.notFound('Resource not found');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should handle conflict error', () => {
    const err = AppError.conflict('Duplicate entry');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('should handle internal error', () => {
    const err = AppError.internal('Something broke');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should return 500 for unknown errors', () => {
    const err = new Error('Unexpected error');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  });
});
