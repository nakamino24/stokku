import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/errors'
import { logger } from '../utils/logger'

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  const requestId = req.headers['x-request-id']
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message: err.message,
        requestId,
        ...(err.details ? { details: err.details } : {}),
      },
    })
    return
  }

  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    name: err.name,
  })

  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      requestId,
    },
  })
}
