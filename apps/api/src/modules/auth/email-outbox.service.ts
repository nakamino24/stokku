import { Prisma, prisma } from '@stokku/database'
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'crypto'
import { config } from '../../config'
import { emailProvider } from './email-provider'
import { logger } from '../../utils/logger'

export type EmailOutboxInput = {
  userId: string
  kind: string
  toEmail: string
  subject: string
  textBody: string
  htmlBody: string
}

type EmailOutboxPayload = Pick<EmailOutboxInput, 'textBody' | 'htmlBody'>

export const EMAIL_OUTBOX_LIMITS = {
  batchSize: 10,
  maxAttempts: 5,
  lockTimeoutMs: 5 * 60 * 1000,
} as const
const STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SENT: 'SENT',
  FAILED: 'FAILED',
} as const

let batchInProgress = false

export function emailOutboxData(input: EmailOutboxInput): Prisma.EmailOutboxMessageUncheckedCreateInput {
  const key = createHash('sha256').update(config.emailOutbox.encryptionKey).digest()
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(JSON.stringify({ textBody: input.textBody, htmlBody: input.htmlBody }), 'utf8'), cipher.final()])
  return {
    userId: input.userId,
    kind: input.kind,
    toEmail: input.toEmail,
    subject: input.subject,
    payloadCiphertext: encrypted.toString('base64url'),
    payloadIv: iv.toString('base64url'),
    payloadTag: cipher.getAuthTag().toString('base64url'),
  }
}

function readPayload(message: { payloadCiphertext: string; payloadIv: string; payloadTag: string }): EmailOutboxPayload {
  const key = createHash('sha256').update(config.emailOutbox.encryptionKey).digest()
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(message.payloadIv, 'base64url'))
  decipher.setAuthTag(Buffer.from(message.payloadTag, 'base64url'))
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(message.payloadCiphertext, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
  return JSON.parse(plaintext) as EmailOutboxPayload
}

function retryAt(attempts: number): Date {
  const delayMs = Math.min(60 * 60 * 1000, 1000 * 2 ** Math.max(0, attempts - 1))
  return new Date(Date.now() + delayMs)
}

async function recoverStaleClaims() {
  return prisma.emailOutboxMessage.updateMany({
    where: {
      status: STATUS.PROCESSING,
      lockedAt: { lt: new Date(Date.now() - EMAIL_OUTBOX_LIMITS.lockTimeoutMs) },
    },
    data: { status: STATUS.PENDING, lockedAt: null, lockedBy: null },
  })
}

async function runBatch() {
  await recoverStaleClaims()
  const workerId = randomUUID()
  const due = await prisma.emailOutboxMessage.findMany({
    where: {
      status: { in: [STATUS.PENDING, STATUS.FAILED] },
      availableAt: { lte: new Date() },
      attempts: { lt: EMAIL_OUTBOX_LIMITS.maxAttempts },
    },
    orderBy: { createdAt: 'asc' },
    take: EMAIL_OUTBOX_LIMITS.batchSize,
    select: { id: true },
  })

  let processed = 0
  for (const { id } of due) {
    const claim = await prisma.emailOutboxMessage.updateMany({
      where: {
        id,
        status: { in: [STATUS.PENDING, STATUS.FAILED] },
        attempts: { lt: EMAIL_OUTBOX_LIMITS.maxAttempts },
      },
      data: {
        status: STATUS.PROCESSING,
        lockedAt: new Date(),
        lockedBy: workerId,
        attempts: { increment: 1 },
      },
    })
    if (claim.count !== 1) continue

    const message = await prisma.emailOutboxMessage.findFirst({
      where: { id, status: STATUS.PROCESSING, lockedBy: workerId },
    })
    if (!message) {
      await prisma.emailOutboxMessage.updateMany({
        where: { id, status: STATUS.PROCESSING, lockedBy: workerId },
        data: { status: STATUS.PENDING, lockedAt: null, lockedBy: null },
      })
      continue
    }

    try {
      const payload = readPayload(message)
      await emailProvider.send({
        to: message.toEmail,
        subject: message.subject,
        text: payload.textBody,
        html: payload.htmlBody,
        idempotencyKey: `stokku-outbox-${message.id}`,
      })
      const finalized = await prisma.emailOutboxMessage.updateMany({
        where: { id, status: STATUS.PROCESSING, lockedBy: workerId },
        data: { status: STATUS.SENT, sentAt: new Date(), lockedAt: null, lockedBy: null, lastError: null },
      })
      if (finalized.count === 1) processed += 1
    } catch (error) {
      const lastError = error instanceof Error ? error.message.slice(0, 1000) : 'Unknown email delivery error'
      await prisma.emailOutboxMessage.updateMany({
        where: { id, status: STATUS.PROCESSING, lockedBy: workerId },
        data: {
          status: message.attempts >= EMAIL_OUTBOX_LIMITS.maxAttempts ? STATUS.FAILED : STATUS.PENDING,
          availableAt: retryAt(message.attempts),
          lockedAt: null,
          lockedBy: null,
          lastError,
        },
      })
      logger.error('Email outbox delivery failed', { messageId: id, attempts: message.attempts, error: lastError })
    }
  }
  return { processed, scanned: due.length }
}

export const EmailOutboxService = {
  async enqueue(client: Prisma.TransactionClient | typeof prisma, input: EmailOutboxInput) {
    return client.emailOutboxMessage.create({ data: emailOutboxData(input) })
  },

  async recoverStaleClaims() {
    return recoverStaleClaims()
  },

  async processBatch() {
    if (batchInProgress) return { processed: 0, scanned: 0 }
    batchInProgress = true
    try {
      return await runBatch()
    } finally {
      batchInProgress = false
    }
  },
}
