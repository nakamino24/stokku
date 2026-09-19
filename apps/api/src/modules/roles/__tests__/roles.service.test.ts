import { RolesService } from '../roles.service'
import { OrganizationRole } from '@stokku/database'

jest.mock('@stokku/database', () => ({
  OrganizationRole: {},
  prisma: {
    organizationMember: { findFirst: jest.fn() },
    role: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    rolePermission: { deleteMany: jest.fn(), createMany: jest.fn() },
  },
}))

const { prisma } = jest.requireMock('@stokku/database')

describe('RolesService authority boundaries', () => {
  beforeEach(() => jest.clearAllMocks())

  it('allows an owner to create a role with any concrete permission', async () => {
    prisma.organizationMember.findFirst.mockResolvedValue({ role: 'OWNER', assignedRole: null })
    prisma.role.findFirst.mockResolvedValue(null)
    prisma.role.create.mockResolvedValue({ id: 'role-1', slug: 'operator', permissions: [] })

    await expect(RolesService.create('org-1', 'owner-1', {
      name: 'Operator',
      slug: 'operator',
      permissions: ['inventory.read', 'inventory.adjust.approve'],
    })).resolves.toEqual(expect.objectContaining({ id: 'role-1' }))
    expect(prisma.role.create).toHaveBeenCalled()
  })

  it('rejects an admin creating a role with a permission outside admin authority', async () => {
    prisma.organizationMember.findFirst.mockResolvedValue({ role: 'ADMIN', assignedRole: null })

    await expect(RolesService.create('org-1', 'admin-1', {
      name: 'Owner-like',
      slug: 'owner-like',
      permissions: ['organization.billing.manage'],
    })).rejects.toMatchObject({ statusCode: 403 })
    expect(prisma.role.create).not.toHaveBeenCalled()
  })

  it('rejects wildcard permissions on custom roles even for an owner', async () => {
    await expect(RolesService.create('org-1', 'owner-1', {
      name: 'Wildcard',
      slug: 'wildcard',
      permissions: ['*'],
    })).rejects.toMatchObject({ statusCode: 400 })
    expect(prisma.organizationMember.findFirst).not.toHaveBeenCalled()
  })

  it('does not modify or delete system roles', async () => {
    prisma.role.findFirst.mockResolvedValue({ id: 'system-admin', organizationId: 'org-1', isSystem: true, permissions: [] })

    await expect(RolesService.update('org-1', 'owner-1', 'system-admin', {
      name: 'Modified',
    })).rejects.toMatchObject({ statusCode: 400 })
    await expect(RolesService.delete('org-1', 'owner-1', 'system-admin')).rejects.toMatchObject({ statusCode: 400 })
    expect(prisma.role.update).not.toHaveBeenCalled()
    expect(prisma.role.delete).not.toHaveBeenCalled()
  })
})
