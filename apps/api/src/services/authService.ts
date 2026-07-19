import { prisma, User } from '@stokku/database';
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from '../utils/auth';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: Pick<User, 'id' | 'email' | 'name' | 'role'>;
  accessToken: string;
}

export interface JwtPayload {
  userId: string;
  email?: string;
}

export class AuthService {
  static async register(email: string, password: string, name: string): Promise<AuthResult & { refreshToken: string }> {
    logger.info('Auth:register', { email });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw AppError.conflict('User with this email already exists');
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: { email, passwordHash: hashedPassword, name },
    });

    await AuthService.createDefaultWorkspace(user.id, name);

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id });

    logger.info('Auth:register success', { userId: user.id });
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      accessToken,
      refreshToken,
    };
  }

  static async login(email: string, password: string): Promise<AuthResult & { refreshToken: string }> {
    logger.info('Auth:login', { email });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const passwordMatch = await comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      throw AppError.unauthorized('Invalid email or password');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id });

    logger.info('Auth:login success', { userId: user.id });
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      accessToken,
      refreshToken,
    };
  }

  static async getCurrentUser(userId: string): Promise<Pick<User, 'id' | 'email' | 'name' | 'role' | 'emailVerified' | 'createdAt'>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, emailVerified: true, createdAt: true },
    });

    if (!user) {
      throw AppError.notFound('User not found');
    }

    return user;
  }

  static refreshAccessToken(refreshToken: string): string {
    const payload = verifyRefreshToken(refreshToken) as JwtPayload;
    return generateAccessToken({ userId: payload.userId });
  }

  static verifyAccessToken(token: string): JwtPayload {
    return verifyAccessToken(token) as JwtPayload;
  }

  private static async createDefaultWorkspace(userId: string, userName: string): Promise<void> {
    const existingWorkspaces = await prisma.workspace.count({ where: { ownerId: userId } });
    if (existingWorkspaces === 0) {
      await prisma.workspace.create({
        data: {
          name: `${userName}'s Workspace`,
          ownerId: userId,
          visibility: 'private',
        },
      });
    }
  }
}
