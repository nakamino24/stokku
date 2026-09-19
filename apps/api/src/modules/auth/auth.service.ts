import { OrganizationRole, prisma } from '@stokku/database'
import jwt from 'jsonwebtoken'
import { createHash, randomBytes, randomUUID } from 'crypto'
import { config } from '../../config'
import { AppError } from '../../utils/errors'
import { logger } from '../../utils/logger'
import { enqueuePasswordResetEmail } from './password-reset-email'
import { enqueueEmailVerification } from './email-verification-email'
import { SYSTEM_ROLE_PERMISSIONS } from '../roles/system-permissions'
import { hashPassword, verifyPassword } from './password-hashing'

const db = prisma as any
const GENERIC_RESET_MESSAGE =
  'If an account exists for this email, password reset instructions have been sent.'

function generateAccessToken(payload: Record<string, unknown>): string {
  return jwt.sign(payload, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpiresIn })
}

function generateOpaqueToken(): string {
  return randomBytes(32).toString('base64url')
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function refreshExpiry(): Date {
  return new Date(Date.now() + config.auth.refreshSessionTtlSeconds * 1000)
}

function resetExpiry(): Date {
  return new Date(Date.now() + config.auth.passwordResetTtlMinutes * 60 * 1000)
}

function verificationExpiry(): Date {
  return new Date(Date.now() + config.auth.emailVerificationTtlMinutes * 60 * 1000)
}

function safeAuthUser(user: any, sessionId?: string) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId,
    organizationSlug: user.organization.slug,
    sessionId: sessionId ?? user.sessionId,
    emailVerified: Boolean(user.emailVerified),
  }
}

function tokenPayload(user: any, sessionId?: string) {
  return safeAuthUser(user, sessionId)
}

async function createRefreshSession(client: any, userId: string, familyId = randomUUID()) {
  const refreshToken = generateOpaqueToken()
  const session = await client.refreshSession.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      familyId,
      expiresAt: refreshExpiry(),
    },
  })
  return { refreshToken, familyId, sessionId: session.id }
}

async function revokeUserSessions(client: any, userId: string, reason: string) {
  return client.refreshSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: reason },
  })
}

export const AuthService = {
  async register(data: {
    email: string
    password: string
    name: string
    organizationName: string
  }) {
    const email = data.email.toLowerCase()
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) throw AppError.conflict('Email already registered')
    const passwordHash = await hashPassword(data.password)
    const verificationToken = generateOpaqueToken()

    return (prisma.$transaction as any)(async (tx: any) => {
      const org = await tx.organization.create({
        data: {
          name: data.organizationName,
          slug: data.organizationName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
        },
      })
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name: data.name,
          emailVerified: false,
          emailVerificationToken: hashToken(verificationToken),
          emailVerificationExpires: verificationExpiry(),
          role: 'OWNER',
          organizationId: org.id,
        },
      })
      const roles = await Promise.all(
        (Object.entries(SYSTEM_ROLE_PERMISSIONS) as [OrganizationRole, readonly string[]][]).map(
          ([role, permissions]) =>
            tx.role.create({
              data: {
                organizationId: org.id,
                name: role
                  .split('_')
                  .map(part => part[0] + part.slice(1).toLowerCase())
                  .join(' '),
                slug: role.toLowerCase(),
                isSystem: true,
                permissions: { create: permissions.map(permission => ({ permission })) },
              },
            })
        )
      )
      const ownerRole = roles.find((role: { slug: string }) => role.slug === 'owner')
      await tx.organizationMember.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          role: 'OWNER',
          roleId: ownerRole?.id,
        },
      })
      await tx.organization.update({ where: { id: org.id }, data: { ownerId: user.id } })
      await tx.auditLog.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          action: 'REGISTER',
          entityType: 'User',
          entityId: user.id,
        },
      })

      const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: org.id,
        organizationSlug: org.slug,
      }
      const verificationUrl = `${config.appUrl}/auth/verify-email?token=${encodeURIComponent(verificationToken)}`
      await enqueueEmailVerification(tx, user.id, user.email, verificationUrl)
      return { user: { ...payload, emailVerified: false }, verificationRequired: true }
    })
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, include: { organization: true } })
    if (!user || !user.passwordHash) throw AppError.unauthorized('Invalid email or password')
    if (!user.isActive) throw AppError.forbidden('Account is deactivated')
    if (!user.emailVerified) throw AppError.forbidden('Email verification required')
    const passwordCheck = await verifyPassword(password, user.passwordHash)
    if (!passwordCheck.valid) throw AppError.unauthorized('Invalid email or password')
    if (passwordCheck.needsRehash) {
      const passwordHash = await hashPassword(password)
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })
    }

    const session = await createRefreshSession(db, user.id)
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    await prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
      },
    })

    const payload = tokenPayload(user, session.sessionId)
    return {
      user: payload,
      accessToken: generateAccessToken(payload),
      refreshToken: session.refreshToken,
    }
  },

  async refresh(refreshToken: string) {
    const tokenHash = hashToken(refreshToken)
    const session = await db.refreshSession.findUnique({
      where: { tokenHash },
      include: { user: { include: { organization: true } } },
    })
    if (!session) throw AppError.unauthorized('Invalid or expired refresh session')

    const now = new Date()
    if (session.revokedAt) {
      const graceMs = config.auth.refreshReuseGraceSeconds * 1000
      const isRecentRotation =
        session.revokedReason === 'ROTATED' &&
        now.getTime() - session.revokedAt.getTime() <= graceMs
      if (isRecentRotation)
        throw new AppError(409, 'Refresh credential was already rotated', 'REFRESH_ALREADY_ROTATED')
      await db.refreshSession.updateMany({
        where: { familyId: session.familyId, revokedAt: null },
        data: { revokedAt: now, revokedReason: 'REUSE_DETECTED' },
      })
      logger.warn('Refresh credential reuse detected', {
        userId: session.userId,
        familyId: session.familyId,
      })
      throw AppError.unauthorized('Invalid or expired refresh session')
    }

    if (session.expiresAt <= now) {
      await db.refreshSession.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { revokedAt: now, revokedReason: 'EXPIRED' },
      })
      throw AppError.unauthorized('Invalid or expired refresh session')
    }
    if (!session.user || !session.user.isActive)
      throw AppError.unauthorized('User not found or inactive')

    const nextRefreshToken = generateOpaqueToken()
    const nextTokenHash = hashToken(nextRefreshToken)
    await (prisma.$transaction as any)(async (tx: any) => {
      const consumed = await tx.refreshSession.updateMany({
        where: { id: session.id, revokedAt: null, expiresAt: { gt: now } },
        data: { revokedAt: now, revokedReason: 'ROTATED' },
      })
      if (consumed.count !== 1)
        throw new AppError(409, 'Refresh credential was already rotated', 'REFRESH_ALREADY_ROTATED')
      await tx.refreshSession.create({
        data: {
          userId: session.userId,
          tokenHash: nextTokenHash,
          familyId: session.familyId,
          expiresAt: refreshExpiry(),
        },
      })
    })

    const payload = tokenPayload(session.user, session.id)
    return { accessToken: generateAccessToken(payload), refreshToken: nextRefreshToken }
  },

  async logout(refreshToken?: string) {
    if (!refreshToken) return { message: 'Logged out successfully' }
    const tokenHash = hashToken(refreshToken)
    const session = await db.refreshSession.findUnique({ where: { tokenHash } })
    if (!session) return { message: 'Logged out successfully' }
    await db.refreshSession.updateMany({
      where: { id: session.id, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: 'LOGOUT' },
    })
    logger.info('Refresh session revoked', {
      userId: session.userId,
      sessionId: session.id,
      reason: 'LOGOUT',
    })
    return { message: 'Logged out successfully' }
  },

  async logoutAll(userId: string) {
    const result = await revokeUserSessions(prisma, userId, 'LOGOUT_ALL')
    logger.info('All refresh sessions revoked', { userId, count: result.count, reason: 'LOGOUT_ALL' })
    return { message: 'All sessions have been logged out' }
  },

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    })
    if (!user) throw AppError.notFound('User not found')
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        slug: user.organization.slug,
        currency: user.organization.currency,
        timezone: user.organization.timezone,
      },
    }
  },

  async updateProfile(userId: string, data: { name?: string; phone?: string; avatarUrl?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      include: { organization: true },
    })
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        slug: user.organization.slug,
        currency: user.organization.currency,
        timezone: user.organization.timezone,
      },
    }
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.passwordHash) throw AppError.notFound('User not found')
    const passwordCheck = await verifyPassword(currentPassword, user.passwordHash)
    if (!passwordCheck.valid) throw AppError.unauthorized('Current password is incorrect')

    const passwordHash = await hashPassword(newPassword)
    await (prisma.$transaction as any)(async (tx: any) => {
      await tx.user.update({ where: { id: userId }, data: { passwordHash } })
      await revokeUserSessions(tx, userId, 'PASSWORD_CHANGED')
    })
    return { message: 'Password updated successfully. Please sign in again.' }
  },

  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return { message: GENERIC_RESET_MESSAGE }

    const rawToken = generateOpaqueToken()
    const tokenHash = hashToken(rawToken)
    const now = new Date()
    const resetUrl = `${config.appUrl}/auth/reset-password?token=${encodeURIComponent(rawToken)}`
    await (prisma.$transaction as any)(async (tx: any) => {
      await tx.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: now },
      })
      await tx.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt: resetExpiry() },
      })
      await tx.auditLog.create({
        data: {
          organizationId: user.organizationId,
          userId: user.id,
          action: 'PASSWORD_RESET_REQUEST',
          entityType: 'User',
          entityId: user.id,
        },
      })
      await enqueuePasswordResetEmail(tx, user.id, user.email, resetUrl)
    })
    logger.info('Password reset requested', { userId: user.id })
    return { message: GENERIC_RESET_MESSAGE }
  },

  async requestEmailVerification(email: string) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || user.emailVerified || !user.isActive) {
      return { message: 'If the account requires verification, instructions have been sent.' }
    }

    const rawToken = generateOpaqueToken()
    const verificationUrl = `${config.appUrl}/auth/verify-email?token=${encodeURIComponent(
      rawToken
    )}`
    await (prisma.$transaction as any)(async (tx: any) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          emailVerificationToken: hashToken(rawToken),
          emailVerificationExpires: verificationExpiry(),
        },
      })
      await enqueueEmailVerification(tx, user.id, user.email, verificationUrl)
    })
    return { message: 'If the account requires verification, instructions have been sent.' }
  },

  async verifyEmail(token: string) {
    const now = new Date()
    const tokenHash = hashToken(token)
    const user = await db.user.findFirst({
      where: {
        emailVerificationToken: tokenHash,
        emailVerificationExpires: { gt: now },
        emailVerified: false,
        isActive: true,
      },
      select: { id: true, organizationId: true },
    })
    if (!user) throw AppError.unauthorized('Invalid or expired verification token')

    await (prisma.$transaction as any)(async (tx: any) => {
      const consumed = await tx.user.updateMany({
        where: {
          id: user.id,
          emailVerificationToken: tokenHash,
          emailVerificationExpires: { gt: now },
          emailVerified: false,
        },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
        },
      })
      if (consumed.count !== 1) throw AppError.unauthorized('Invalid or expired verification token')
      await tx.auditLog.create({
        data: {
          organizationId: user.organizationId,
          userId: user.id,
          action: 'EMAIL_VERIFIED',
          entityType: 'User',
          entityId: user.id,
        },
      })
    })

    return { message: 'Email verified successfully. You can now sign in.' }
  },

  async validatePasswordResetToken(token: string) {
    const tokenHash = hashToken(token)
    const resetRecord = await db.passwordResetToken.findUnique({ where: { tokenHash } })
    const now = new Date()
    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt <= now) {
      throw AppError.unauthorized('Invalid or expired password reset token')
    }
    return { valid: true }
  },

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = hashToken(token)
    const resetRecord = await db.passwordResetToken.findUnique({ where: { tokenHash } })
    const now = new Date()
    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt <= now) {
      throw AppError.unauthorized('Invalid or expired password reset token')
    }

    const passwordHash = await hashPassword(newPassword)
    await (prisma.$transaction as any)(async (tx: any) => {
      const consumed = await tx.passwordResetToken.updateMany({
        where: { id: resetRecord.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      })
      if (consumed.count !== 1)
        throw AppError.unauthorized('Invalid or expired password reset token')
      await tx.user.update({ where: { id: resetRecord.userId }, data: { passwordHash } })
      await tx.passwordResetToken.updateMany({
        where: { userId: resetRecord.userId, id: { not: resetRecord.id }, usedAt: null },
        data: { usedAt: now },
      })
      await revokeUserSessions(tx, resetRecord.userId, 'PASSWORD_RESET')

      const resetUser = await tx.user.findUnique({ where: { id: resetRecord.userId } })
      if (resetUser) {
        await tx.auditLog.create({
          data: {
            organizationId: resetUser.organizationId,
            userId: resetUser.id,
            action: 'PASSWORD_RESET_COMPLETE',
            entityType: 'User',
            entityId: resetUser.id,
          },
        })
      }
    })

    logger.info('Password reset completed', { userId: resetRecord.userId })
    return { message: 'Password reset successfully. Please sign in with your new password.' }
  },
}
