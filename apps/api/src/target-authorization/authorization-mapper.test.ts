import { mapDenyReasonToHttpError } from './authorization-mapper';

describe('authorization deny reason mapper', () => {
  it('maps each ADR-0017 deny reason to its documented HTTP status and code', () => {
    expect(mapDenyReasonToHttpError('IDENTITY_INACTIVE')).toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
    expect(mapDenyReasonToHttpError('EMAIL_NOT_VERIFIED')).toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
    expect(mapDenyReasonToHttpError('SESSION_REVOKED')).toMatchObject({ statusCode: 401, code: 'UNAUTHENTICATED' });
    expect(mapDenyReasonToHttpError('SESSION_EXPIRED')).toMatchObject({ statusCode: 401, code: 'UNAUTHENTICATED' });
    expect(mapDenyReasonToHttpError('MEMBERSHIP_REQUIRED')).toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
    expect(mapDenyReasonToHttpError('MEMBERSHIP_INACTIVE')).toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
    expect(mapDenyReasonToHttpError('ORGANIZATION_INACTIVE')).toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
    expect(mapDenyReasonToHttpError('ORGANIZATION_MISMATCH')).toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
    expect(mapDenyReasonToHttpError('MEMBERSHIP_IDENTITY_MISMATCH')).toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
    expect(mapDenyReasonToHttpError('UNKNOWN_ROLE')).toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
    expect(mapDenyReasonToHttpError('UNKNOWN_PERMISSION_GRANT')).toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
    expect(mapDenyReasonToHttpError('UNKNOWN_PERMISSION')).toMatchObject({ statusCode: 400, code: 'VALIDATION_FAILED' });
    expect(mapDenyReasonToHttpError('PERMISSION_DENIED')).toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
    expect(mapDenyReasonToHttpError('WAREHOUSE_SCOPE_REQUIRED')).toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
    expect(mapDenyReasonToHttpError('WAREHOUSE_ACCESS_DENIED')).toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
  });

  it('does not leak sensitive data in error messages', () => {
    for (const reason of ['WAREHOUSE_ACCESS_DENIED', 'ORGANIZATION_MISMATCH', 'MEMBERSHIP_INACTIVE']) {
      const message = mapDenyReasonToHttpError(reason as never).message;
      expect(message).not.toMatch(/password|token|cookie|secret|warehouseId|organizationId|userId/i);
    }
  });
});