import { ORGANIZATION_ROLES, PERMISSIONS, type OrganizationRole, type Permission } from './types'

const permissionSet = new Set<string>(PERMISSIONS)
const roleSet = new Set<string>(ORGANIZATION_ROLES)

export const ROLE_HIERARCHY: Record<OrganizationRole, number> = {
  OWNER: 100,
  ADMIN: 80,
  INVENTORY_MANAGER: 60,
  WAREHOUSE_STAFF: 40,
  CASHIER: 20,
  VIEWER: 10,
}

// Roles grant only named capabilities. No wildcard capability is part of the target model.
export const ROLE_PERMISSIONS: Record<OrganizationRole, readonly Permission[]> = {
  OWNER: PERMISSIONS,
  ADMIN: [
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
  ],
  INVENTORY_MANAGER: [
    'organization.members.read',
    'warehouse.read',
    'inventory.read',
    'inventory.adjust.request',
    'inventory.adjust.approve',
    'inventory.transfer.execute',
  ],
  WAREHOUSE_STAFF: [
    'warehouse.read',
    'inventory.read',
    'inventory.adjust.request',
    'inventory.transfer.execute',
  ],
  CASHIER: ['inventory.read'],
  VIEWER: ['warehouse.read', 'inventory.read'],
}

export function isOrganizationRole(value: string): value is OrganizationRole {
  return roleSet.has(value)
}

export function isPermission(value: string): value is Permission {
  return permissionSet.has(value)
}

export function permissionsForRole(role: OrganizationRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role]
}
