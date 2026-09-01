import { prisma } from '@stokku/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { config } from '../../config';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { passwordResetEmailSender } from './password-reset-email';

const db = prisma as any;
const GENERIC_RESET_MESSAGE = 'If an account exists for this email, password reset instructions have been sent.';

function generateAccessToken(payload: Record<string, unknown>): string {
  return jwt.sign(payload, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpiresIn });
}

function generateOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function refreshExpiry(): Date {
  return new Date(Date.now() + config.auth.refreshSessionTtlSeconds * 1000);
}

function resetExpiry(): Date {
  return new Date(Date.now() + config.auth.passwordResetTtlMinutes * 60 * 1000);
}

function tokenPayload(user: any) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId,
    organizationSlug: user.organization.slug,
  };
}

async function createRefreshSession(client: any, userId: string, familyId = randomUUID()) {
  const refreshToken = generateOpaqueToken();
  await client.refreshSession.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      familyId,
      expiresAt: refreshExpiry(),
    },
  });
  return { refreshToken, familyId };
}

async function revokeUserSessions(client: any, userId: string, reason: string) {
  return client.refreshSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: reason },
  });
}

export const AuthService = {
  async register(data: { email: string; password: string; name: string; organizationName: string }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw AppError.conflict('Email already registered');

    const passwordHash = await bcrypt.hash(data.password, 12);

    return (prisma.$transaction as any)(async (tx: any) => {
      const org = await tx.organization.create({
        data: {
          name: data.organizationName,
          slug: data.organizationName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
        },
      });

      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
          emailVerified: true,
          role: 'OWNER',
          organizationId: org.id,
        },
      });

      await tx.organization.update({ where: { id: org.id }, data: { ownerId: user.id } });
      await tx.auditLog.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          action: 'REGISTER',
          entityType: 'User',
          entityId: user.id,
        },
      });

      const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: org.id,
        organizationSlug: org.slug,
      };
      const session = await createRefreshSession(tx, user.id);

      return {
        user: payload,
        accessToken: generateAccessToken(payload),
        refreshToken: session.refreshToken,
      };
    });
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email }, include: { organization: true } });

    if (!user || !user.passwordHash) throw AppError.unauthorized('Invalid email or password');
    if (!user.isActive) throw AppError.forbidden('Account is deactivated');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw AppError.unauthorized('Invalid email or password');

    const session = await createRefreshSession(db, user.id);

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
      },
    });

    const payload = tokenPayload(user);
    return {
      user: payload,
      accessToken: generateAccessToken(payload),
      refreshToken: session.refreshToken,
    };
  },

  async refresh(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    const session = await db.refreshSession.findUnique({
      where: { tokenHash },
      include: { user: { include: { organization: true } } },
    });

    if (!session) throw AppError.unauthorized('Invalid or expired refresh session');

    const now = new Date();
    if (session.revokedAt) {
      const graceMs = config.auth.refreshReuseGraceSeconds * 1000;
      const isRecentRotation =
        session.revokedReason === 'ROTATED' && now.getTime() - session.revokedAt.getTime() <= graceMs;

      if (isRecentRotation) {
        throw new AppError(409, 'Refresh credential was already rotated', 'REFRESH_ALREADY_ROTATED');
      }

      await db.refreshSession.updateMany({
        where: { familyId: session.familyId, revokedAt: null },
        data: { revokedAt: now, revokedReason: 'REUSE_DETECTED' },
      });
      logger.warn('Refresh credential reuse detected', { userId: session.userId, familyId: session.familyId });
      throw AppError.unauthorized('Invalid or expired refresh session');
    }

    if (session.expiresAt <= now) {
      await db.refreshSession.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { revokedAt: now, revokedReason: 'EXPIRED' },
      });
      throw AppError.unauthorized('Invalid or expired refresh session');
    }

    if (!session.user || !session.user.isActive) throw AppError.unauthorized('User not found or inactive');

    const nextRefreshToken = generateOpaqueToken();
    const nextTokenHash = hashToken(nextRefreshToken);

    await (prisma.$transaction as any)(async (tx: any) => {
      const consumed = await tx.refreshSession.updateMany({
        where: { id: session.id, revokedAt: null, expiresAt: { gt: now } },
        data: { revokedAt: now, revokedReason: 'ROTATED' },
      });

      if (consumed.count !== 1) {
        throw new AppError(409, 'Refresh credential was already rotated', 'REFRESH_ALREADY_ROTATED');
      }

      await tx.refreshSession.create({
        data: {
          userId: session.userId,
          tokenHash: nextTokenHash,
          familyId: session.familyId,
          expiresAt: refreshExpiry(),
        },
      });
    });

    const payload = tokenPayload(session.user);
    return {
      accessToken: generateAccessToken(payload),
      refreshToken: nextRefreshToken,
    };
  },

  async logout(refreshToken?: string) {
    if (!refreshToken) return { message: 'Logged out successfully' };

    const tokenHash = hashToken(refreshToken);
    const session = await db.refreshSession.findUnique({ where: { tokenHash } });
    if (!session) return { message: 'Logged out successfully' };

    await db.refreshSession.updateMany({
      where: { id: session.id, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: 'LOGOUT' },
    });

    logger.info('Refresh session revoked', { userId: session.userId, sessionId: session.id, reason: 'LOGOUT' });
    return { message: 'Logged out successfully' };
  },

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { organization: true } });
    if (!user) throw AppError.notFound('User not found');

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
    };
  },

  async updateProfile(userId: string, data: { name?: string; phone?: string; avatarUrl?: string }) {
    const user = await prisma.user.update({ where: { id: userId }, data, include: { organization: true } });
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
    };
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) throw AppError.notFound('User not found');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw AppError.unauthorized('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await (prisma.$transaction as any)(async (tx: any) => {
      await tx.user.update({ where: { id: userId }, data: { passwordHash } });
      await revokeUserSessions(tx, userId, 'PASSWORD_CHANGED');
    });

    return { message: 'Password updated successfully. Please sign in again.' };
  },

  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { message: GENERIC_RESET_MESSAGE };

    const rawToken = generateOpaqueToken();
    const tokenHash = hashToken(rawToken);
    const now = new Date();

    await (prisma.$transaction as any)(async (tx: any) => {
      await tx.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: now },
      });
      await tx.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: resetExpiry(),
        },
      });
      await tx.auditLog.create({
        data: {
          organizationId: user.organizationId,
          userId: user.id,
          action: 'PASSWORD_RESET_REQUEST',
          entityType: 'User',
          entityId: user.id,
        },
      });
    });

    const resetUrl = `${config.appUrl}/auth/reset-password?token=${encodeURIComponent(rawToken)}`;
    await passwordResetEmailSender.sendPasswordResetEmail({ email: user.email, resetUrl });
    logger.info('Password reset requested', { userId: user.id });

    return { message: GENERIC_RESET_MESSAGE };
  },

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = hashToken(token);
    const resetRecord = await db.passwordResetToken.findUnique({ where: { tokenHash } });
    const now = new Date();

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt <= now) {
      throw AppError.unauthorized('Invalid or expired password reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await (prisma.$transaction as any)(async (tx: any) => {
      const consumed = await tx.passwordResetToken.updateMany({
        where: { id: resetRecord.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (consumed.count !== 1) throw AppError.unauthorized('Invalid or expired password reset token');

      await tx.user.update({ where: { id: resetRecord.userId }, data: { passwordHash } });
      await tx.passwordResetToken.updateMany({
        where: { userId: resetRecord.userId, id: { not: resetRecord.id }, usedAt: null },
        data: { usedAt: now },
      });
      await revokeUserSessions(tx, resetRecord.userId, 'PASSWORD_RESET');

      const resetUser = await tx.user.findUnique({ where: { id: resetRecord.userId } });
      if (resetUser) {
        await tx.auditLog.create({
          data: {
            organizationId: resetUser.organizationId,
            userId: resetUser.id,
            action: 'PASSWORD_RESET_COMPLETE',
            entityType: 'User',
            entityId: resetUser.id,
          },
        });
      }
    });

    logger.info('Password reset completed', { userId: resetRecord.userId });
    return { message: 'Password reset successfully. Please sign in with your new password.' };
  },
};
