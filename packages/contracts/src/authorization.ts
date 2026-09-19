import type { AuthorizationDecision, AuthorizationDenyReason } from '@stokku/domain'
import {
  authorizationContextSchema,
  authorizationRequestSchema,
  roleChangeRequestSchema,
  type AuthorizationContextInput,
  type AuthorizationRequestInput,
  type RoleChangeRequestInput,
} from '@stokku/validation'

export const AUTHORIZATION_DENY_CODES = [
  'IDENTITY_INACTIVE',
  'EMAIL_NOT_VERIFIED',
  'SESSION_REVOKED',
  'SESSION_EXPIRED',
  'MEMBERSHIP_REQUIRED',
  'MEMBERSHIP_INACTIVE',
  'ORGANIZATION_INACTIVE',
  'ORGANIZATION_MISMATCH',
  'MEMBERSHIP_IDENTITY_MISMATCH',
  'UNKNOWN_ROLE',
  'UNKNOWN_PERMISSION_GRANT',
  'UNKNOWN_PERMISSION',
  'PERMISSION_DENIED',
  'WAREHOUSE_SCOPE_REQUIRED',
  'WAREHOUSE_ACCESS_DENIED',
] as const satisfies readonly AuthorizationDenyReason[]

export {
  authorizationContextSchema,
  authorizationRequestSchema,
  roleChangeRequestSchema,
}

export type AuthorizationContextDto = AuthorizationContextInput
export type AuthorizationRequestDto = AuthorizationRequestInput
export type RoleChangeRequestDto = RoleChangeRequestInput
export type AuthorizationDecisionDto = AuthorizationDecision
