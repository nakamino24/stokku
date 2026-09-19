/**
 * Rollback evidence: with ENABLE_TARGET_AUTHORIZATION_ADAPTER=false (default),
 * the parity route is not registered and requests fall through to 404.
 * No flag, no extra environment configuration required.
 */

import request from 'supertest';

describe('target authorization parity route (disabled — rollback evidence)', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.ENABLE_TARGET_AUTHORIZATION_ADAPTER = 'false';
  });

  afterEach(() => {
    delete process.env.ENABLE_TARGET_AUTHORIZATION_ADAPTER;
  });

  it('returns 404 because the route is not registered when the flag is false', async () => {
    const { default: app } = require('../app');
    const response = await request(app)
      .post('/api/v1/_parity/authorization/check')
      .send({ organizationId: '00000000-0000-4000-8000-000000000001', permission: 'inventory.read' });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});