import { prisma } from '@stokku/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { AppError } from '../../utils/errors';

function generateAccessToken(payload: Record<string, unknown>): string {
  return jwt.sign(payload, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpiresIn });
}

function generateRefreshToken(payload: Record<string, unknown>): string {
  return jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });
}

function verifyToken(token: string, secret: string) {
  try {
    return jwt.verify(token, secret) as jwt.JwtPayload;
  } catch {
    return null;
  }
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

      await tx.organization.update({
        where: { id: org.id },
        data: { ownerId: user.id },
      });

      await tx.auditLog.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          action: 'REGISTER',
          entityType: 'User',
          entityId: user.id,
        },
      });

      const tokenPayload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: org.id,
        organizationSlug: org.slug,
      };

      return {
        user: tokenPayload,
        accessToken: generateAccessToken(tokenPayload),
        refreshToken: generateRefreshToken({ id: user.id }),
      };
    });
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });

    if (!user || !user.passwordHash) throw AppError.unauthorized('Invalid email or password');
    if (!user.isActive) throw AppError.forbidden('Account is deactivated');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw AppError.unauthorized('Invalid email or password');

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
      },
    });

    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      organizationSlug: user.organization.slug,
    };

    return {
      user: tokenPayload,
      accessToken: generateAccessToken(tokenPayload),
      refreshToken: generateRefreshToken({ id: user.id }),
    };
  },

  async refresh(refreshToken: string) {
    const payload = verifyToken(refreshToken, config.jwt.refreshSecret);
    if (!payload) throw AppError.unauthorized('Invalid or expired refresh token');

    const user = await prisma.user.findUnique({
      where: { id: payload.id as string },
      include: { organization: true },
    });

    if (!user || !user.isActive) throw AppError.unauthorized('User not found or inactive');

    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      organizationSlug: user.organization.slug,
    };

    return {
      accessToken: generateAccessToken(tokenPayload),
      refreshToken: generateRefreshToken({ id: user.id }),
    };
  },

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });
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
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      include: { organization: true },
    });
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
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    return { message: 'Password updated successfully' };
  },

  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'If the email exists, a reset link has been sent' };

    const resetToken = generateAccessToken({ id: user.id, purpose: 'password_reset' });
    // resetToken would be sent via email in production
    void resetToken;
    await prisma.auditLog.create({
      data: { organizationId: user.organizationId, userId: user.id, action: 'PASSWORD_RESET_REQUEST', entityType: 'User', entityId: user.id },
    });

    return { message: 'If the email exists, a reset link has been sent' };
  },

  async resetPassword(token: string, newPassword: string) {
    const payload = verifyToken(token, config.jwt.accessSecret);
    if (!payload || payload.purpose !== 'password_reset') throw AppError.unauthorized('Invalid or expired reset token');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: payload.id as string }, data: { passwordHash } });

    return { message: 'Password reset successfully' };
  },
};
