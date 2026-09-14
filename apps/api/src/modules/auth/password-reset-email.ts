import { EmailOutboxService } from './email-outbox.service';

export async function enqueuePasswordResetEmail(
  client: Parameters<typeof EmailOutboxService.enqueue>[0],
  userId: string,
  email: string,
  resetUrl: string,
) {
  return EmailOutboxService.enqueue(client, {
    userId,
    kind: 'PASSWORD_RESET',
    toEmail: email,
    subject: 'Reset your Stokku password',
    textBody: `Reset your Stokku password: ${resetUrl}`,
    htmlBody: `<p>Reset your Stokku password:</p><p><a href="${resetUrl}">Reset password</a></p>`,
  })
}
