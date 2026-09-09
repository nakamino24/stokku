import express from 'express'
import request from 'supertest'
import { errorHandler } from '../errorHandler'

jest.mock('../../config', () => ({
  config: {
    cors: { origins: ['https://stokku.vercel.app'] },
    rateLimit: { api: 100, auth: 20, passwordReset: 5 },
  },
}))

import { corsMiddleware } from '../security'

describe('credentialed CORS policy', () => {
  const app = express()
    .use(corsMiddleware)
    .get('/probe', (_req, res) => res.json({ ok: true }))
    .use(errorHandler)

  it('allows the exact configured production origin with credentials', async () => {
    const response = await request(app).get('/probe').set('Origin', 'https://stokku.vercel.app')

    expect(response.status).toBe(200)
    expect(response.headers['access-control-allow-origin']).toBe('https://stokku.vercel.app')
    expect(response.headers['access-control-allow-credentials']).toBe('true')
  })

  it('rejects an untrusted browser origin', async () => {
    const response = await request(app).get('/probe').set('Origin', 'https://attacker.example')

    expect(response.status).toBe(403)
    expect(response.body.code).toBe('FORBIDDEN')
  })
})
