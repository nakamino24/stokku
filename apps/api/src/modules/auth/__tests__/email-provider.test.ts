import https from 'https'
import type { ClientRequest, IncomingMessage } from 'http'
import { ResendEmailProvider } from '../email-provider'

jest.mock('https')

const mockedHttps = https as jest.Mocked<typeof https>

describe('email provider configuration', () => {
  it('keeps email credentials out of the browser-facing surface', () => {
    expect('RESEND_API_KEY').not.toMatch(/^NEXT_PUBLIC_/)
    expect('EMAIL_FROM').not.toMatch(/^NEXT_PUBLIC_/)
  })
})

describe('ResendEmailProvider', () => {
  function mockRequest(statusCode?: number) {
    const response = {
      statusCode,
      setEncoding: jest.fn(),
      on: jest.fn(),
    } as unknown as IncomingMessage
    ;(response.on as jest.Mock).mockImplementation((event: string, callback: (value?: string) => void) => {
      if (event === 'data') callback('{"error":"rejected"}')
      if (event === 'end') callback()
      return response
    })
    const request = {
      on: jest.fn(),
      setTimeout: jest.fn(),
      destroy: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    } as unknown as ClientRequest
    ;(request.on as jest.Mock).mockImplementation((event: string, callback: (error: Error) => void) => {
      if (event === 'error' && statusCode === undefined) callback(new Error('network failure'))
      return request
    })
    mockedHttps.request.mockImplementationOnce(((_url: string | URL, _options: object, callback?: (res: IncomingMessage) => void) => {
      if (callback && statusCode !== undefined) callback(response)
      return request
    }) as unknown as typeof mockedHttps.request)
    return request
  }

  beforeEach(() => jest.clearAllMocks())

  it('resolves for a successful provider response', async () => {
    const request = mockRequest(202)
    await expect(new ResendEmailProvider({ apiKey: 'key', from: 'Stokku <no-reply@example.com>' }).send({
      to: 'user@example.com',
      subject: 'Subject',
      text: 'Text',
      html: '<p>Text</p>',
    })).resolves.toBeUndefined()
    expect(request.setTimeout).toHaveBeenCalledWith(10_000, expect.any(Function))
    expect(request.end).toHaveBeenCalled()
  })

  it('passes the outbox idempotency key to the provider request', async () => {
    mockRequest(202)
    await expect(new ResendEmailProvider({ apiKey: 'key', from: 'sender@example.com' }).send({
      to: 'user@example.com',
      subject: 'Subject',
      text: 'Text',
      html: '<p>Text</p>',
      idempotencyKey: 'stokku-outbox-message-1',
    })).resolves.toBeUndefined()
    expect(mockedHttps.request.mock.calls[0][1]).toEqual(expect.objectContaining({
      headers: expect.objectContaining({ 'Idempotency-Key': 'stokku-outbox-message-1' }),
    }))
  })

  it('rejects non-success responses without exposing the API key', async () => {
    mockRequest(422)
    const error = await new ResendEmailProvider({ apiKey: 'secret-key', from: 'sender@example.com' }).send({
      to: 'user@example.com',
      subject: 'Subject',
      text: 'Text',
      html: '<p>Text</p>',
    }).catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toContain('Email provider rejected message (422)')
    expect((error as Error).message).not.toContain('secret-key')
  })

  it('rejects network failures', async () => {
    mockRequest()
    await expect(new ResendEmailProvider({ apiKey: 'key', from: 'sender@example.com' }).send({
      to: 'user@example.com',
      subject: 'Subject',
      text: 'Text',
      html: '<p>Text</p>',
    })).rejects.toThrow('network failure')
  })
})
