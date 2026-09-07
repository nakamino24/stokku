import { Request, Response } from 'express';
import { requirePermission } from '../rbac';

const mockPrisma = {
  organizationMember: { findUnique: jest.fn() },
  role: { findFirst: jest.fn() },
};

jest.mock('@stokku/database', () => ({ prisma: mockPrisma }));

function request(role = 'VIEWER'): Request {
  return {
    user: { id: 'user-1', organizationId: 'org-1', role },
  } as unknown as Request;
}

describe('action permissions', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uses membership as authority instead of a stale ADMIN token', async () => {
    mockPrisma.organizationMember.findUnique.mockResolvedValue({ role: 'VIEWER', assignedRole: null });
    mockPrisma.role.findFirst.mockResolvedValue(null);
    const next = jest.fn();
    await requirePermission('inventory.adjust.approve')(request('ADMIN'), {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('accepts an explicitly assigned custom-role permission', async () => {
    mockPrisma.organizationMember.findUnique.mockResolvedValue({
      role: 'VIEWER',
      assignedRole: { permissions: [{ permission: 'inventory.adjust.approve' }] },
    });
    const next = jest.fn();
    await requirePermission('inventory.adjust.approve')(request(), {} as Response, next);
    expect(next).toHaveBeenCalledWith();
    expect(mockPrisma.role.findFirst).not.toHaveBeenCalled();
  });
});
