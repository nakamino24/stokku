import { ORGANIZATION_ROLES, PERMISSIONS } from '@stokku/domain'
import { z } from 'zod'

const uuidSchema = z.string().uuid()
const timestampSchema = z.string().datetime({ offset: true })
const rawPermissionSchema = z.string().min(1).max(64)
const permissionSchema = rawPermissionSchema
const organizationRoleSchema = z.enum(ORGANIZATION_ROLES)
const warehouseIdsSchema = z.array(uuidSchema).max(100).superRefine((warehouseIds, context) => {
  if (new Set(warehouseIds).size !== warehouseIds.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Warehouse assignments must be unique' })
  }
})

export const identityPrincipalSchema = z
  .object({
    identityId: uuidSchema,
    status: z.enum(['active', 'inactive']),
    emailVerified: z.boolean(),
  })
  .strict()

export const sessionClaimSchema = z
  .object({
    sessionId: uuidSchema,
    status: z.enum(['active', 'revoked']),
    expiresAt: timestampSchema,
  })
  .strict()

export const warehouseScopeSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('assigned-warehouses'),
      warehouseIds: warehouseIdsSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal('organization-wide'),
      grant: z.literal('explicit'),
    })
    .strict(),
])

export const organizationMembershipSchema = z
  .object({
    membershipId: uuidSchema,
    organizationId: uuidSchema,
    identityId: uuidSchema,
    status: z.enum(['active', 'inactive']),
    organizationStatus: z.enum(['active', 'inactive']),
    role: organizationRoleSchema,
    permissionGrants: z.array(rawPermissionSchema).max(100).superRefine((permissions, context) => {
      if (new Set(permissions).size !== permissions.length) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: 'Permission grants must be unique' })
      }
    }),
    warehouseScope: warehouseScopeSchema,
  })
  .strict()

export const authorizationContextSchema = z
  .object({
    identity: identityPrincipalSchema,
    session: sessionClaimSchema,
    membership: organizationMembershipSchema.optional(),
  })
  .strict()

export const authorizationRequestSchema = z
  .object({
    organizationId: uuidSchema,
    permission: permissionSchema,
    warehouseId: uuidSchema.optional(),
  })
  .strict()

// Owner transfer is a distinct command, so a normal role-change payload cannot request OWNER.
export const roleChangeRequestSchema = z
  .object({
    role: z.enum(['ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF', 'CASHIER', 'VIEWER']),
  })
  .strict()

export type IdentityPrincipalInput = z.infer<typeof identityPrincipalSchema>
export type SessionClaimInput = z.infer<typeof sessionClaimSchema>
export type WarehouseScopeInput = z.infer<typeof warehouseScopeSchema>
export type OrganizationMembershipInput = z.infer<typeof organizationMembershipSchema>
export type AuthorizationContextInput = z.infer<typeof authorizationContextSchema>
export type AuthorizationRequestInput = z.infer<typeof authorizationRequestSchema>
export type RoleChangeRequestInput = z.infer<typeof roleChangeRequestSchema>
