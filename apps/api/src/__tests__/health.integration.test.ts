import request from 'supertest'
import { prisma } from '@stokku/database'
import app from '../app'

const databaseUrl = process.env.DATABASE_URL
const databaseCredentialsAreConfigured = Boolean(databaseUrl) && process.env.RUN_DATABASE_INTEGRATION_TESTS === 'true'
const describeIfDatabase = databaseCredentialsAreConfigured ? describe : describe.skip

describeIfDatabase('GET /health with PostgreSQL', () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('reports a connected database', async () => {
    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'healthy',
        database: 'connected',
      })
    )
  })
})
