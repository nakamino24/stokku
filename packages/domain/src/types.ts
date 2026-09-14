export const ORGANIZATION_ROLES = [
  'OWNER',
  'ADMIN',
  'INVENTORY_MANAGER',
  'WAREHOUSE_STAFF',
  'CASHIER',
  'VIEWER',
] as const

export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number]

export const PERMISSIONS = [
  'identity.session.read',
  'identity.session.revoke',
  'organization.members.read',
  'organization.members.manage',
  'organization.roles.read',
  'organization.roles.manage',
  'warehouse.read',
  'warehouse.manage',
  'warehouse.scope.manage',
  'inventory.read',
  'inventory.adjust.request',
  'inventory.adjust.approve',
  'inventory.transfer.execute',
  'audit.read',
] as const

export type Permission = (typeof PERMISSIONS)[number]

export type IdentityStatus = 'active' | 'inactive'
export type SessionStatus = 'active' | 'revoked'
export type MembershipStatus = 'active' | 'inactive'
export type OrganizationStatus = 'active' | 'inactive'

export type IdentityPrincipal = {
  identityId: string
  status: IdentityStatus
  emailVerified: boolean
}

// This claim contains lifecycle metadata only. Credential material belongs to infrastructure.
export type SessionClaim = {
  sessionId: string
  status: SessionStatus
  expiresAt: string
}

export type WarehouseScope =
  | {
      kind: 'assigned-warehouses'
      warehouseIds: readonly string[]
    }
  | {
      kind: 'organization-wide'
      grant: 'explicit'
    }

export type OrganizationMembership = {
  membershipId: string
  organizationId: string
  identityId: string
  status: MembershipStatus
  organizationStatus: OrganizationStatus
  role: OrganizationRole
  permissionGrants: readonly string[]
  warehouseScope: WarehouseScope
}

export type AuthorizationContext = {
  identity: IdentityPrincipal
  session: SessionClaim
  membership?: OrganizationMembership
}

export type AuthorizationRequest = {
  organizationId: string
  permission: string
  warehouseId?: string
}

export type AuthorizationDenyReason =
  | 'IDENTITY_INACTIVE'
  | 'EMAIL_NOT_VERIFIED'
  | 'SESSION_REVOKED'
  | 'SESSION_EXPIRED'
  | 'MEMBERSHIP_REQUIRED'
  | 'MEMBERSHIP_INACTIVE'
  | 'ORGANIZATION_INACTIVE'
  | 'ORGANIZATION_MISMATCH'
  | 'MEMBERSHIP_IDENTITY_MISMATCH'
  | 'UNKNOWN_ROLE'
  | 'UNKNOWN_PERMISSION_GRANT'
  | 'UNKNOWN_PERMISSION'
  | 'PERMISSION_DENIED'
  | 'WAREHOUSE_SCOPE_REQUIRED'
  | 'WAREHOUSE_ACCESS_DENIED'

export type AuthorizationDecision =
  | { outcome: 'allow' }
  | { outcome: 'deny'; reason: AuthorizationDenyReason }

export type RoleAssignmentRequest = {
  actor: OrganizationMembership
  target: OrganizationMembership
  requestedRole: string
}

export type RoleAssignmentDenyReason =
  | 'ACTOR_MEMBERSHIP_INACTIVE'
  | 'TARGET_MEMBERSHIP_INACTIVE'
  | 'CROSS_ORGANIZATION_TARGET'
  | 'SELF_ASSIGNMENT'
  | 'UNKNOWN_ACTOR_ROLE'
  | 'UNKNOWN_CURRENT_TARGET_ROLE'
  | 'UNKNOWN_REQUESTED_ROLE'
  | 'OWNER_ROLE_PROTECTED'
  | 'INSUFFICIENT_ROLE_AUTHORITY'

export type RoleAssignmentDecision =
  | { outcome: 'allow' }
  | { outcome: 'deny'; reason: RoleAssignmentDenyReason }
