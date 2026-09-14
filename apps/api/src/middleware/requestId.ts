import { Request, Response, NextFunction } from 'express'
import { randomUUID } from 'crypto'

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const supplied = req.headers['x-request-id']
  const requestId =
    typeof supplied === 'string' && /^[A-Za-z0-9._:-]{1,128}$/.test(supplied)
      ? supplied
      : randomUUID()
  req.headers['x-request-id'] = requestId
  res.setHeader('x-request-id', requestId)
  next()
}
