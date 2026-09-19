import { EmailOutboxService, emailOutboxData } from '../email-outbox.service'
import { emailProvider } from '../email-provider'

jest.mock('@stokku/database', () => ({
  Prisma: {},
  prisma: {
    emailOutboxMessage: {
      updateMany: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}))

jest.mock('../email-provider', () => ({
  emailProvider: { send: jest.fn() },
}))

jest.mock('../../../config', () => ({
  config: { emailOutbox: { encryptionKey: 'test-outbox-encryption-key' } },
}))

const { prisma } = jest.requireMock('@stokku/database')

const messagePayload = emailOutboxData({
  userId: 'user-1',
  kind: 'TEST',
  toEmail: 'user@example.com',
  subject: 'Subject',
  textBody: 'Text',
  htmlBody: '<p>Text</p>',
})

describe('EmailOutboxService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('claims, sends, and marks a due message as sent', async () => {
    prisma.emailOutboxMessage.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 })
    prisma.emailOutboxMessage.findMany.mockResolvedValue([{ id: 'message-1' }])
    prisma.emailOutboxMessage.findFirst.mockResolvedValue({
      ...messagePayload,
      id: 'message-1',
      attempts: 1,
    })
    ;(emailProvider.send as jest.Mock).mockResolvedValue(undefined)

    await expect(EmailOutboxService.processBatch()).resolves.toEqual({ processed: 1, scanned: 1 })
    expect(emailProvider.send).toHaveBeenCalledWith({
      to: 'user@example.com',
      subject: 'Subject',
      text: 'Text',
      html: '<p>Text</p>',
      idempotencyKey: 'stokku-outbox-message-1',
    })
    expect(prisma.emailOutboxMessage.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'message-1', lockedBy: expect.any(String) }),
      data: expect.objectContaining({ status: 'SENT' }),
    }))
  })

  it('returns failed delivery to pending with a bounded retry delay', async () => {
    prisma.emailOutboxMessage.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 })
    prisma.emailOutboxMessage.findMany.mockResolvedValue([{ id: 'message-1' }])
    prisma.emailOutboxMessage.findFirst.mockResolvedValue({
      ...messagePayload,
      id: 'message-1',
      attempts: 2,
    })
    ;(emailProvider.send as jest.Mock).mockRejectedValue(new Error('provider unavailable'))

    await expect(EmailOutboxService.processBatch()).resolves.toEqual({ processed: 0, scanned: 1 })
    expect(prisma.emailOutboxMessage.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'message-1', lockedBy: expect.any(String) }),
      data: expect.objectContaining({ status: 'PENDING', lastError: 'provider unavailable' }),
    }))
  })

  it('moves a message to terminal failure after the final attempt', async () => {
    prisma.emailOutboxMessage.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 })
    prisma.emailOutboxMessage.findMany.mockResolvedValue([{ id: 'message-1' }])
    prisma.emailOutboxMessage.findFirst.mockResolvedValue({
      ...messagePayload,
      id: 'message-1',
      attempts: 5,
    })
    ;(emailProvider.send as jest.Mock).mockRejectedValue(new Error('permanent provider failure'))

    await expect(EmailOutboxService.processBatch()).resolves.toEqual({ processed: 0, scanned: 1 })
    expect(prisma.emailOutboxMessage.updateMany).toHaveBeenLastCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'FAILED', lastError: 'permanent provider failure' }),
    }))
  })

  it('recovers stale processing claims', async () => {
    prisma.emailOutboxMessage.updateMany.mockResolvedValue({ count: 2 })

    await expect(EmailOutboxService.recoverStaleClaims()).resolves.toEqual({ count: 2 })
    expect(prisma.emailOutboxMessage.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ status: 'PROCESSING', lockedAt: expect.any(Object) }),
      data: { status: 'PENDING', lockedAt: null, lockedBy: null },
    })
  })

  it('prevents overlapping batches in the same process', async () => {
    let release: () => void = () => undefined
    const blocked = new Promise<void>((resolve) => {
      release = resolve
    })
    prisma.emailOutboxMessage.updateMany.mockResolvedValueOnce({ count: 0 })
    prisma.emailOutboxMessage.findMany.mockImplementationOnce(() => blocked.then(() => []))

    const first = EmailOutboxService.processBatch()
    await expect(EmailOutboxService.processBatch()).resolves.toEqual({ processed: 0, scanned: 0 })
    release()
    await expect(first).resolves.toEqual({ processed: 0, scanned: 0 })
  })
})
