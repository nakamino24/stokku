import {
  isOrganizationRole,
  isPermission,
  permissionsForRole,
  ROLE_HIERARCHY,
} from './permissions'
import type {
  AuthorizationContext,
  AuthorizationDecision,
  AuthorizationDenyReason,
  AuthorizationRequest,
  OrganizationMembership,
  RoleAssignmentDecision,
  RoleAssignmentDenyReason,
  RoleAssignmentRequest,
  SessionClaim,
  WarehouseScope,
} from './types'

function deny(reason: AuthorizationDenyReason): AuthorizationDecision {
  return { outcome: 'deny', reason }
}

function denyRoleAssignment(reason: RoleAssignmentDenyReason): RoleAssignmentDecision {
  return { outcome: 'deny', reason }
}

export function isSessionUsable(session: SessionClaim, now: Date): boolean {
  const expiry = Date.parse(session.expiresAt)
  return session.status === 'active' && Number.isFinite(expiry) && expiry > now.getTime()
}

export function hasWarehouseAccess(scope: WarehouseScope, warehouseId: string): boolean {
  return scope.kind === 'organization-wide' || scope.warehouseIds.includes(warehouseId)
}

function hasOnlyKnownPermissionGrants(membership: OrganizationMembership): boolean {
  return membership.permissionGrants.every(isPermission)
}

function effectivePermissions(membership: OrganizationMembership): ReadonlySet<string> {
  return new Set([...permissionsForRole(membership.role), ...membership.permissionGrants])
}

export function authorize(
  context: AuthorizationContext,
  request: AuthorizationRequest,
  now: Date
): AuthorizationDecision {
  if (context.identity.status !== 'active') return deny('IDENTITY_INACTIVE')
  if (!context.identity.emailVerified) return deny('EMAIL_NOT_VERIFIED')
  if (context.session.status === 'revoked') return deny('SESSION_REVOKED')
  if (!isSessionUsable(context.session, now)) return deny('SESSION_EXPIRED')

  const membership = context.membership
  if (!membership) return deny('MEMBERSHIP_REQUIRED')
  if (membership.status !== 'active') return deny('MEMBERSHIP_INACTIVE')
  if (membership.organizationStatus !== 'active') return deny('ORGANIZATION_INACTIVE')
  if (membership.identityId !== context.identity.identityId) return deny('MEMBERSHIP_IDENTITY_MISMATCH')
  if (membership.organizationId !== request.organizationId) return deny('ORGANIZATION_MISMATCH')
  if (!isOrganizationRole(membership.role)) return deny('UNKNOWN_ROLE')
  if (!hasOnlyKnownPermissionGrants(membership)) return deny('UNKNOWN_PERMISSION_GRANT')
  if (!isPermission(request.permission)) return deny('UNKNOWN_PERMISSION')
  if (!effectivePermissions(membership).has(request.permission)) return deny('PERMISSION_DENIED')

  if (!request.warehouseId) return { outcome: 'allow' }
  if (membership.warehouseScope.kind === 'assigned-warehouses' && membership.warehouseScope.warehouseIds.length === 0) {
    return deny('WAREHOUSE_SCOPE_REQUIRED')
  }
  if (!hasWarehouseAccess(membership.warehouseScope, request.warehouseId)) {
    return deny('WAREHOUSE_ACCESS_DENIED')
  }

  return { outcome: 'allow' }
}

export function evaluateRoleAssignment(request: RoleAssignmentRequest): RoleAssignmentDecision {
  const { actor, target, requestedRole } = request

  if (actor.status !== 'active' || actor.organizationStatus !== 'active') {
    return denyRoleAssignment('ACTOR_MEMBERSHIP_INACTIVE')
  }
  if (target.status !== 'active' || target.organizationStatus !== 'active') {
    return denyRoleAssignment('TARGET_MEMBERSHIP_INACTIVE')
  }
  if (actor.organizationId !== target.organizationId) {
    return denyRoleAssignment('CROSS_ORGANIZATION_TARGET')
  }
  if (actor.identityId === target.identityId) return denyRoleAssignment('SELF_ASSIGNMENT')
  if (!isOrganizationRole(actor.role)) return denyRoleAssignment('UNKNOWN_ACTOR_ROLE')
  if (!isOrganizationRole(target.role)) return denyRoleAssignment('UNKNOWN_CURRENT_TARGET_ROLE')
  if (!isOrganizationRole(requestedRole)) return denyRoleAssignment('UNKNOWN_REQUESTED_ROLE')

  // Owner transfer is a separate, explicitly approved command and is never a role edit.
  if (target.role === 'OWNER' || requestedRole === 'OWNER') {
    return denyRoleAssignment('OWNER_ROLE_PROTECTED')
  }
  if (
    ROLE_HIERARCHY[actor.role] <= ROLE_HIERARCHY[target.role] ||
    ROLE_HIERARCHY[actor.role] <= ROLE_HIERARCHY[requestedRole]
  ) {
    return denyRoleAssignment('INSUFFICIENT_ROLE_AUTHORITY')
  }

  return { outcome: 'allow' }
}
