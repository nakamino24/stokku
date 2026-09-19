import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '@stokku/database'
import { AppError } from '../utils/errors'
import { config } from '../config'
import { AuthRequest } from '../utils/types'

export const authMiddleware = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      throw AppError.unauthorized('Access token required')
    }

    const token = authHeader.split(' ')[1]
    const payload = jwt.verify(token, config.jwt.accessSecret) as jwt.JwtPayload
    if (
      typeof payload.id !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.name !== 'string' ||
      typeof payload.organizationId !== 'string' ||
      typeof payload.organizationSlug !== 'string' ||
      typeof payload.sessionId !== 'string'
    ) {
      throw AppError.unauthorized('Invalid access token')
    }

    const user = await prisma.user.findFirst({
      where: {
        id: payload.id,
        organizationId: payload.organizationId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        organization: { select: { slug: true } },
        emailVerified: true,
      },
    })
    if (!user) throw AppError.unauthorized('Invalid or inactive account')
    if (!user.emailVerified) throw AppError.forbidden('Email verification required')

    ;(req as AuthRequest).user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      organizationSlug: user.organization.slug,
      sessionId: payload.sessionId,
      emailVerified: user.emailVerified,
    }
    next()
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(AppError.unauthorized('Invalid or expired token'))
    } else {
      next(error)
    }
  }
}
