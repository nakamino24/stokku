import { config } from '../../config';
import { logger } from '../../utils/logger';

export interface PasswordResetEmailInput {
  email: string;
  resetUrl: string;
}

export interface PasswordResetEmailSender {
  sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void>;
}

class DevelopmentPasswordResetEmailSender implements PasswordResetEmailSender {
  async sendPasswordResetEmail({ email, resetUrl }: PasswordResetEmailInput): Promise<void> {
    logger.info('Development password reset email', { email, resetUrl });
  }
}

class UnconfiguredProductionPasswordResetEmailSender implements PasswordResetEmailSender {
  async sendPasswordResetEmail({ email }: PasswordResetEmailInput): Promise<void> {
    // Never include the reset URL or raw token in production logs.
    logger.warn('Password reset email provider is not configured', { email });
  }
}

export const passwordResetEmailSender: PasswordResetEmailSender =
  config.nodeEnv === 'production'
    ? new UnconfiguredProductionPasswordResetEmailSender()
    : new DevelopmentPasswordResetEmailSender();
