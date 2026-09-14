import { OrganizationRole } from '@stokku/database'
import { AppError } from '../../../utils/errors'
import { UsersService } from '../users.service'

jest.mock('@stokku/database', () => ({
  OrganizationRole: {},
  prisma: {
    user: { findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn(), update: jest.fn() },
    role: { findFirst: jest.fn() },
    organizationMember: { upsert: jest.fn(), findFirst: jest.fn() },
    $transaction: jest.fn(),
  },
}))

const { prisma } = jest.requireMock('@stokku/database')

describe('UsersService security boundaries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    prisma.$transaction.mockImplementation((callback: (tx: typeof prisma) => unknown) =>
      callback(prisma)
    )
  })

  it('rejects an administrator attempting to grant owner', async () => {
    prisma.user.findFirst
      .mockResolvedValueOnce({ id: 'admin', role: 'ADMIN' })
      .mockResolvedValueOnce({ id: 'target', role: 'VIEWER' })

    await expect(
      UsersService.updateRole('org-1', 'admin', 'target', 'OWNER' as OrganizationRole)
    ).rejects.toMatchObject({ statusCode: 403 })
    expect(prisma.organizationMember.upsert).not.toHaveBeenCalled()
  })

  it('rejects an actor assigning a role at or above their authority', async () => {
    prisma.user.findFirst
      .mockResolvedValueOnce({ id: 'manager', role: 'INVENTORY_MANAGER' })
      .mockResolvedValueOnce({ id: 'target', role: 'VIEWER' })

    await expect(
      UsersService.updateRole('org-1', 'manager', 'target', 'ADMIN' as OrganizationRole)
    ).rejects.toMatchObject({ statusCode: 403 })
  })

  it('does not return sensitive fields when deactivating a user', async () => {
    prisma.organizationMember.findFirst.mockResolvedValue({ role: 'ADMIN' })
    prisma.user.findFirst.mockResolvedValue({ id: 'target', role: 'VIEWER' })
    prisma.user.update.mockResolvedValue({
      id: 'target',
      name: 'Target',
      email: 'target@test.com',
      role: 'VIEWER',
      isActive: false,
    })

    const result = await UsersService.deactivate('org-1', 'admin', 'target')

    expect(result).toEqual({
      id: 'target',
      name: 'Target',
      email: 'target@test.com',
      role: 'VIEWER',
      isActive: false,
    })
    expect(result).not.toHaveProperty('passwordHash')
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        select: { id: true, name: true, email: true, role: true, isActive: true },
      })
    )
  })

  it('protects the organization owner from deactivation', async () => {
    prisma.organizationMember.findFirst.mockResolvedValue({ role: 'ADMIN' })
    prisma.user.findFirst.mockResolvedValue({ id: 'owner', role: 'OWNER' })

    await expect(UsersService.deactivate('org-1', 'admin', 'owner')).rejects.toEqual(
      expect.objectContaining({ statusCode: 403 })
    )
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('rejects deactivation of an equally privileged user', async () => {
    prisma.organizationMember.findFirst.mockResolvedValue({ role: 'ADMIN' })
    prisma.user.findFirst.mockResolvedValue({ id: 'peer', role: 'ADMIN' })

    await expect(UsersService.deactivate('org-1', 'admin', 'peer')).rejects.toEqual(
      expect.objectContaining({ statusCode: 403 })
    )
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('rejects self-deactivation', async () => {
    await expect(UsersService.deactivate('org-1', 'user-1', 'user-1')).rejects.toBeInstanceOf(
      AppError
    )
    expect(prisma.user.findFirst).not.toHaveBeenCalled()
  })
})
