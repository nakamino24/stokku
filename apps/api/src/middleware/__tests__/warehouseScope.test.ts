import { assertWarehouseAccess, getWarehouseScope } from '../warehouseScope';

jest.mock('@stokku/database', () => ({
  Prisma: {},
  prisma: {},
}));

function client() {
  return {
    organizationMember: { findFirst: jest.fn() },
    organizationMemberWarehouse: { findMany: jest.fn() },
    warehouse: { findFirst: jest.fn() },
  } as any;
}

describe('warehouse scope', () => {
  it('treats owners and admins as organization-wide', async () => {
    const db = client();
    db.organizationMember.findFirst.mockResolvedValue({ id: 'member', role: 'ADMIN' });

    await expect(getWarehouseScope(db, 'org-1', 'user-1')).resolves.toEqual({
      global: true,
      warehouseIds: [],
    });
    expect(db.organizationMemberWarehouse.findMany).not.toHaveBeenCalled();
  });

  it('requires an explicit assignment for operational users', async () => {
    const db = client();
    db.warehouse.findFirst.mockResolvedValue({ id: 'warehouse-a' });
    db.organizationMember.findFirst.mockResolvedValue({ id: 'member', role: 'WAREHOUSE_STAFF' });
    db.organizationMemberWarehouse.findMany.mockResolvedValue([{ warehouseId: 'warehouse-a' }]);

    await expect(assertWarehouseAccess(db, 'org-1', 'user-1', 'warehouse-a')).resolves.toBeUndefined();
  });

  it('rejects a warehouse outside the member assignment', async () => {
    const db = client();
    db.warehouse.findFirst.mockResolvedValue({ id: 'warehouse-b' });
    db.organizationMember.findFirst.mockResolvedValue({ id: 'member', role: 'WAREHOUSE_STAFF' });
    db.organizationMemberWarehouse.findMany.mockResolvedValue([{ warehouseId: 'warehouse-a' }]);

    await expect(assertWarehouseAccess(db, 'org-1', 'user-1', 'warehouse-b'))
      .rejects.toMatchObject({ statusCode: 403 });
  });
});
