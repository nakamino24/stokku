import { WarehouseAssignmentsService } from '../warehouse-assignments.service'

jest.mock('@stokku/database', () => ({
  prisma: {
    organizationMember: { findFirst: jest.fn() },
    organizationMemberWarehouse: { findMany: jest.fn(), deleteMany: jest.fn(), createMany: jest.fn() },
    warehouse: { findMany: jest.fn() },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn(),
  },
}))

const { prisma } = jest.requireMock('@stokku/database')

describe('WarehouseAssignmentsService authority boundaries', () => {
  beforeEach(() => jest.clearAllMocks())

  it('prevents an admin from changing an owner warehouse scope', async () => {
    prisma.organizationMember.findFirst
      .mockResolvedValueOnce({ id: 'admin-membership', role: 'ADMIN' })
      .mockResolvedValueOnce({ id: 'owner-membership', role: 'OWNER' })

    await expect(WarehouseAssignmentsService.replace('org-1', 'admin-1', 'owner-1', ['warehouse-1']))
      .rejects.toMatchObject({ statusCode: 403 })
    expect(prisma.organizationMemberWarehouse.deleteMany).not.toHaveBeenCalled()
  })

  it('prevents a user from changing another user at the same role', async () => {
    prisma.organizationMember.findFirst
      .mockResolvedValueOnce({ id: 'staff-membership', role: 'WAREHOUSE_STAFF' })
      .mockResolvedValueOnce({ id: 'peer-membership', role: 'WAREHOUSE_STAFF' })

    await expect(WarehouseAssignmentsService.replace('org-1', 'staff-1', 'peer-1', []))
      .rejects.toMatchObject({ statusCode: 403 })
  })

  it('rejects warehouses from another organization before mutating assignments', async () => {
    prisma.organizationMember.findFirst
      .mockResolvedValueOnce({ id: 'owner-membership', role: 'OWNER' })
      .mockResolvedValueOnce({ id: 'staff-membership', role: 'WAREHOUSE_STAFF' })
    prisma.warehouse.findMany.mockResolvedValue([])

    await expect(WarehouseAssignmentsService.replace('org-1', 'owner-1', 'staff-1', ['other-warehouse']))
      .rejects.toMatchObject({ statusCode: 404 })
    expect(prisma.organizationMemberWarehouse.deleteMany).not.toHaveBeenCalled()
  })
})
