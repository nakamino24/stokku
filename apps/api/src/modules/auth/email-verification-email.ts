import { EmailOutboxService } from './email-outbox.service'

export async function enqueueEmailVerification(
  client: Parameters<typeof EmailOutboxService.enqueue>[0],
  userId: string,
  email: string,
  verificationUrl: string,
) {
  return EmailOutboxService.enqueue(client, {
    userId,
    kind: 'EMAIL_VERIFICATION',
    toEmail: email,
    subject: 'Verify your Stokku email address',
    textBody: `Verify your Stokku account: ${verificationUrl}`,
    htmlBody: `<p>Verify your Stokku account:</p><p><a href="${verificationUrl}">Verify email address</a></p>`,
  })
}
