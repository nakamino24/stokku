import { Request, Response, NextFunction } from 'express'
import { authMiddleware } from '../auth'
import { AppError } from '../../utils/errors'

jest.mock('@stokku/database', () => ({
  prisma: { user: { findFirst: jest.fn() } },
}))

jest.mock('../../config', () => ({
  config: { jwt: { accessSecret: 'test-access-secret-min-16-chars' } },
}))

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}))

describe('authMiddleware', () => {
  let req: Request
  let res: Response
  let next: jest.Mock

  beforeEach(() => {
    req = { headers: {} } as Request
    res = {} as Response
    next = jest.fn()
  })

  it('should call next with 401 when no token', async () => {
    await authMiddleware(req, res, next)

    expect(next).toHaveBeenCalled()
    const err = next.mock.calls[0][0] as AppError
    expect(err.statusCode).toBe(401)
  })

  it('should call next with 401 for malformed header', async () => {
    req.headers = { authorization: 'Bearer' }

    await authMiddleware(req, res, next)

    expect(next).toHaveBeenCalled()
    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(401)
  })

  it('should call next with 401 for invalid token', async () => {
    req.headers = { authorization: 'Bearer invalid-token' }
    const jwt = jest.requireMock('jsonwebtoken')
    ;(jwt.verify as jest.Mock).mockImplementation(() => {
      throw { name: 'JsonWebTokenError' }
    })

    await authMiddleware(req, res, next)

    expect(next).toHaveBeenCalled()
    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(401)
  })

  it('should set req.user for valid token', async () => {
    req.headers = { authorization: 'Bearer valid-token' }
    const jwt = jest.requireMock('jsonwebtoken')
    const payload = {
      id: 'user-1',
      email: 'test@test.com',
      name: 'Test',
      role: 'ADMIN',
      organizationId: 'org-1',
      organizationSlug: 'test-org',
      sessionId: 'session-1',
    }
    ;(jwt.verify as jest.Mock).mockReturnValue(payload)
    const { prisma } = jest.requireMock('@stokku/database')
    prisma.user.findFirst.mockResolvedValue({
      ...payload,
      emailVerified: true,
      organization: { slug: 'test-org' },
    })

    await authMiddleware(req, res, next)
    expect(next).toHaveBeenCalledWith()
    expect((req as any).user).toEqual({ ...payload, emailVerified: true })
  })

  it('rejects inactive accounts even when the token is valid', async () => {
    req.headers = { authorization: 'Bearer valid-token' }
    const jwt = jest.requireMock('jsonwebtoken')
    const { prisma } = jest.requireMock('@stokku/database')
    ;(jwt.verify as jest.Mock).mockReturnValue({
      id: 'user-1',
      email: 'test@test.com',
      name: 'Test',
      organizationId: 'org-1',
      organizationSlug: 'test-org',
      sessionId: 'session-1',
    })
    prisma.user.findFirst.mockResolvedValue(null)

    await authMiddleware(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }))
  })
})
