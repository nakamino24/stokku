import type { AuthorizationDenyReason } from '@stokku/domain';

export type HttpAuthorizationError = {
  statusCode: number;
  code: string;
  message: string;
};

/**
 * Maps target authorization deny reasons to HTTP status codes and AppError codes.
 * Based on ADR-0017 fail-closed error mapping table.
 */
export function mapDenyReasonToHttpError(reason: AuthorizationDenyReason): HttpAuthorizationError {
  const mapping: Record<AuthorizationDenyReason, HttpAuthorizationError> = {
    IDENTITY_INACTIVE: {
      statusCode: 403,
      code: 'FORBIDDEN',
      message: 'User account is inactive',
    },
    EMAIL_NOT_VERIFIED: {
      statusCode: 403,
      code: 'FORBIDDEN',
      message: 'Email verification required',
    },
    SESSION_REVOKED: {
      statusCode: 401,
      code: 'UNAUTHENTICATED',
      message: 'Session has been revoked',
    },
    SESSION_EXPIRED: {
      statusCode: 401,
      code: 'UNAUTHENTICATED',
      message: 'Session has expired',
    },
    MEMBERSHIP_REQUIRED: {
      statusCode: 403,
      code: 'FORBIDDEN',
      message: 'Organization membership required',
    },
    MEMBERSHIP_INACTIVE: {
      statusCode: 403,
      code: 'FORBIDDEN',
      message: 'Organization membership is inactive',
    },
    ORGANIZATION_INACTIVE: {
      statusCode: 403,
      code: 'FORBIDDEN',
      message: 'Organization is inactive',
    },
    ORGANIZATION_MISMATCH: {
      statusCode: 403,
      code: 'FORBIDDEN',
      message: 'Organization selector does not match your membership',
    },
    MEMBERSHIP_IDENTITY_MISMATCH: {
      statusCode: 403,
      code: 'FORBIDDEN',
      message: 'Identity mismatch',
    },
    UNKNOWN_ROLE: {
      statusCode: 403,
      code: 'FORBIDDEN',
      message: 'Role not recognized',
    },
    UNKNOWN_PERMISSION_GRANT: {
      statusCode: 403,
      code: 'FORBIDDEN',
      message: 'Unknown permission grant detected',
    },
    UNKNOWN_PERMISSION: {
      statusCode: 400,
      code: 'VALIDATION_FAILED',
      message: 'Permission not recognized',
    },
    PERMISSION_DENIED: {
      statusCode: 403,
      code: 'FORBIDDEN',
      message: 'Insufficient permissions',
    },
    WAREHOUSE_SCOPE_REQUIRED: {
      statusCode: 403,
      code: 'FORBIDDEN',
      message: 'Warehouse access required but no assignments exist',
    },
    WAREHOUSE_ACCESS_DENIED: {
      statusCode: 403,
      code: 'FORBIDDEN',
      message: 'You do not have access to this warehouse',
    },
  };

  return mapping[reason];
}
