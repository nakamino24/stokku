import { config } from '../../config'
import https from 'https'

export type EmailMessage = {
  to: string
  subject: string
  text: string
  html: string
  idempotencyKey?: string
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>
}

export type ResendEmailProviderOptions = {
  apiKey: string
  from: string
  timeoutMs?: number
}

export class ResendEmailProvider implements EmailProvider {
  private readonly options: Required<ResendEmailProviderOptions>

  constructor(options: ResendEmailProviderOptions) {
    this.options = { timeoutMs: 10_000, ...options }
  }

  async send(message: EmailMessage): Promise<void> {
    const body = JSON.stringify({
      from: this.options.from,
      to: [message.to],
      subject: message.subject,
      text: message.text,
      html: message.html,
    })
    await new Promise<void>((resolve, reject) => {
      const request = https.request('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          ...(message.idempotencyKey ? { 'Idempotency-Key': message.idempotencyKey } : {}),
        },
      }, (response) => {
        let responseText = ''
        response.setEncoding('utf8')
        response.on('data', (chunk) => { responseText += chunk })
        response.on('end', () => {
          if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
            resolve()
            return
          }
          reject(new Error(`Email provider rejected message (${response.statusCode}): ${responseText.slice(0, 300)}`))
        })
      })
      request.setTimeout(this.options.timeoutMs, () => {
        request.destroy(new Error('Email provider request timed out'))
      })
      request.on('error', reject)
      request.write(body)
      request.end()
    })
  }
}

class DevelopmentEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<void> {
    console.info('Development email', { to: message.to, subject: message.subject, text: message.text })
  }
}

export const emailProvider: EmailProvider =
  config.nodeEnv === 'production'
    ? new ResendEmailProvider({ apiKey: config.email.resendApiKey, from: config.email.from })
    : new DevelopmentEmailProvider()
