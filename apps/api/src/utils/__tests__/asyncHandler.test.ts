import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../asyncHandler';

describe('asyncHandler', () => {
  it('should call the handler and resolve successfully', async () => {
    const handler = asyncHandler(async (_req: Request, res: Response) => {
      res.json({ ok: true });
    });

    const req = {} as Request;
    const res = { json: jest.fn() } as unknown as Response;
    const next = jest.fn() as NextFunction;

    await handler(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
    expect(next).not.toHaveBeenCalled();
  });

  it('should catch errors and forward to next', async () => {
    const error = new Error('test error');
    const handler = asyncHandler(async (_req: Request, _res: Response, _next: NextFunction) => {
      throw error;
    });

    const req = {} as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    await handler(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });
});
