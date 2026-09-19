/**
 * Proves the parity route is registered when ENABLE_TARGET_AUTHORIZATION_ADAPTER=true.
 * The request is rejected by the reference authMiddleware before any DB access.
 */

import request from 'supertest';

describe('target authorization parity route (enabled)', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.ENABLE_TARGET_AUTHORIZATION_ADAPTER = 'true';
  });

  afterEach(() => {
    delete process.env.ENABLE_TARGET_AUTHORIZATION_ADAPTER;
  });

  it('mounts the route and requires authentication', async () => {
    const { default: app } = require('../app');
    const response = await request(app)
      .post('/api/v1/_parity/authorization/check')
      .send({ organizationId: '00000000-0000-4000-8000-000000000001', permission: 'inventory.read' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('does not fall through to the 404 catch-all when enabled', async () => {
    const { default: app } = require('../app');
    const response = await request(app).post('/api/v1/_parity/authorization/check').send({});

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });
});