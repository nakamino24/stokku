import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../validate';
import { AppError } from '../../utils/errors';

const testSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().int().positive().optional(),
});

describe('validate middleware', () => {
  let req: Request;
  let res: Response;
  let next: jest.Mock;

  beforeEach(() => {
    req = { body: {} } as Request;
    res = {} as Response;
    next = jest.fn();
  });

  it('should pass validation and call next', () => {
    req.body = { name: 'Test', age: 25 };

    validate({ body: testSchema })(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should call next with AppError 400 for invalid body', () => {
    req.body = { name: '' };

    validate({ body: testSchema })(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
  });

  it('should call next with AppError 400 for missing required field', () => {
    req.body = {};

    validate({ body: testSchema })(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(400);
  });
});
