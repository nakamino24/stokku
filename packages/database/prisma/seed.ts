import { OrganizationRole, Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

const SYSTEM_ROLE_PERMISSIONS: Record<OrganizationRole, readonly string[]> = {
  OWNER: ['*'],
  ADMIN: ['*'],
  INVENTORY_MANAGER: [
    'product.read', 'product.create', 'product.update', 'product.archive',
    'inventory.read', 'inventory.adjust.request', 'inventory.adjust.approve',
    'inventory.transfer.create', 'inventory.transfer.dispatch', 'inventory.transfer.receive',
    'inventory.reconcile', 'po.read', 'po.create', 'po.submit', 'po.approve', 'po.send', 'po.cancel',
    'receipt.create', 'receipt.post', 'receipt.reverse', 'so.read', 'so.create', 'so.confirm', 'so.cancel',
    'pick.execute', 'pack.execute', 'shipment.post',
    'cycle_count.create', 'cycle_count.execute', 'cycle_count.approve',
  ],
  WAREHOUSE_STAFF: [
    'product.read', 'inventory.read', 'inventory.adjust.request', 'inventory.transfer.create',
    'inventory.transfer.dispatch', 'inventory.transfer.receive', 'po.read', 'receipt.create',
    'receipt.post', 'so.read', 'pick.execute', 'pack.execute',
  ],
  CASHIER: ['product.read', 'inventory.read', 'so.read', 'so.create'],
  VIEWER: ['product.read', 'inventory.read', 'po.read', 'so.read'],
};

async function seedOpeningBalance(input: {
  organizationId: string;
  warehouseId: string;
  binId?: string;
  productId: string;
  variantId?: string;
  quantity: string;
  userId: string;
  sequence: number;
  reorderPoint?: string;
  reorderQty?: string;
}) {
  const existing = await prisma.stockLevel.findFirst({
    where: {
      organizationId: input.organizationId,
      warehouseId: input.warehouseId,
      binId: input.binId ?? null,
      productId: input.productId,
      variantId: input.variantId ?? null,
      inventoryStatus: 'AVAILABLE',
      lotNumber: null,
      serialNumber: null,
    },
  });
  if (existing) return existing;

  const quantity = new Prisma.Decimal(input.quantity);
  const balance = await prisma.stockLevel.create({
    data: {
      organizationId: input.organizationId,
      warehouseId: input.warehouseId,
      binId: input.binId ?? null,
      productId: input.productId,
      variantId: input.variantId ?? null,
      onHand: quantity,
      allocated: 0,
      hold: 0,
      available: quantity,
      reorderPoint: input.reorderPoint,
      reorderQty: input.reorderQty,
      version: 1,
    },
  });
  await prisma.stockMovement.create({
    data: {
      organizationId: input.organizationId,
      type: 'RECEIPT',
      productId: input.productId,
      variantId: input.variantId ?? null,
      warehouseId: input.warehouseId,
      stockLevelId: balance.id,
      quantity,
      onHandDelta: quantity,
      beforeOnHand: 0,
      afterOnHand: quantity,
      beforeAllocated: 0,
      afterAllocated: 0,
      beforeHold: 0,
      afterHold: 0,
      beforeAvailable: 0,
      afterAvailable: quantity,
      sourceDocumentType: 'SEED',
      sourceDocumentId: input.organizationId,
      reference: 'SEED-OPENING',
      idempotencyKey: `SEED:OPENING:${input.sequence}`,
      reason: 'Demo opening inventory',
      createdById: input.userId,
    },
  });
  return balance;
}

async function main() {
  console.log('Seeding database...');
  const passwordHash = await bcrypt.hash('password123', 12);

  const existingOrganization = await prisma.organization.findUnique({ where: { slug: 'demo-company' } });
  const organization = existingOrganization ?? await prisma.organization.create({
    data: { id: randomUUID(), name: 'Demo Company', slug: 'demo-company', currency: 'USD', timezone: 'UTC' },
  });
  const user = await prisma.user.upsert({
    where: { email: 'demo@stokku.app' },
    update: {},
    create: {
      email: 'demo@stokku.app',
      passwordHash,
      name: 'Demo User',
      emailVerified: true,
      role: 'OWNER',
      organizationId: organization.id,
    },
  });
  await prisma.organization.update({ where: { id: organization.id }, data: { ownerId: user.id } });

  let ownerRoleId: string | undefined;
  for (const [role, permissions] of Object.entries(SYSTEM_ROLE_PERMISSIONS) as [OrganizationRole, readonly string[]][]) {
    const systemRole = await prisma.role.upsert({
      where: { organizationId_slug: { organizationId: organization.id, slug: role.toLowerCase() } },
      update: { name: role, isSystem: true },
      create: {
        organizationId: organization.id,
        name: role.split('_').join(' '),
        slug: role.toLowerCase(),
        isSystem: true,
      },
    });
    if (role === 'OWNER') ownerRoleId = systemRole.id;
    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permission: { roleId: systemRole.id, permission } },
        update: {},
        create: { roleId: systemRole.id, permission },
      });
    }
  }
  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: organization.id, userId: user.id } },
    update: { role: 'OWNER', roleId: ownerRoleId },
    create: { organizationId: organization.id, userId: user.id, role: 'OWNER', roleId: ownerRoleId },
  });

  const rawMaterials = await prisma.category.upsert({
    where: { organizationId_slug: { organizationId: organization.id, slug: 'raw-materials' } },
    update: {},
    create: { organizationId: organization.id, name: 'Raw Materials', slug: 'raw-materials', color: '#8B5CF6' },
  });
  const chemicals = await prisma.category.upsert({
    where: { organizationId_slug: { organizationId: organization.id, slug: 'chemicals' } },
    update: {},
    create: { organizationId: organization.id, parentId: rawMaterials.id, name: 'Chemicals', slug: 'chemicals', color: '#A78BFA' },
  });
  const metals = await prisma.category.upsert({
    where: { organizationId_slug: { organizationId: organization.id, slug: 'metals' } },
    update: {},
    create: { organizationId: organization.id, parentId: rawMaterials.id, name: 'Metals', slug: 'metals', color: '#C4B5FD' },
  });
  const finishedGoods = await prisma.category.upsert({
    where: { organizationId_slug: { organizationId: organization.id, slug: 'finished-goods' } },
    update: {},
    create: { organizationId: organization.id, name: 'Finished Goods', slug: 'finished-goods', color: '#10B981' },
  });

  const solvent = await prisma.product.upsert({
    where: { organizationId_sku: { organizationId: organization.id, sku: 'SOL-200' } },
    update: {},
    create: {
      organizationId: organization.id,
      categoryId: chemicals.id,
      name: 'Industrial Solvent X-200',
      sku: 'SOL-200',
      unit: 'l',
      unitPrice: '45',
      costPrice: '28',
    },
  });
  const aluminum = await prisma.product.upsert({
    where: { organizationId_sku: { organizationId: organization.id, sku: 'AL-6061' } },
    update: {},
    create: {
      organizationId: organization.id,
      categoryId: metals.id,
      name: 'Aluminum Sheet 6061',
      sku: 'AL-6061',
      unit: 'sheet',
      unitPrice: '85',
      costPrice: '55',
    },
  });
  const bearing = await prisma.product.upsert({
    where: { organizationId_sku: { organizationId: organization.id, sku: 'BRG-KIT' } },
    update: {},
    create: {
      organizationId: organization.id,
      categoryId: finishedGoods.id,
      name: 'Precision Bearing Kit',
      sku: 'BRG-KIT',
      unit: 'set',
      unitPrice: '220',
      costPrice: '145',
    },
  });

  const solvent5L = await prisma.productVariant.upsert({
    where: { sku_productId: { sku: 'SOL-200-5L', productId: solvent.id } },
    update: {},
    create: { productId: solvent.id, name: '5L Canister', sku: 'SOL-200-5L', unitPrice: '45', costPrice: '28', options: '{"volume":"5L"}' },
  });
  const solvent20L = await prisma.productVariant.upsert({
    where: { sku_productId: { sku: 'SOL-200-20L', productId: solvent.id } },
    update: {},
    create: { productId: solvent.id, name: '20L Drum', sku: 'SOL-200-20L', unitPrice: '150', costPrice: '95', options: '{"volume":"20L"}' },
  });
  const aluminum2mm = await prisma.productVariant.upsert({
    where: { sku_productId: { sku: 'AL-6061-2MM', productId: aluminum.id } },
    update: {},
    create: { productId: aluminum.id, name: '2mm Thickness', sku: 'AL-6061-2MM', unitPrice: '120', costPrice: '78', options: '{"thickness":"2mm"}' },
  });
  const bearingKit = await prisma.productVariant.upsert({
    where: { sku_productId: { sku: 'BRG-6200-KIT', productId: bearing.id } },
    update: {},
    create: { productId: bearing.id, name: '6200 Series (10pcs)', sku: 'BRG-6200-KIT', unitPrice: '220', costPrice: '145' },
  });

  const warehouse = await prisma.warehouse.upsert({
    where: { organizationId_code: { organizationId: organization.id, code: 'WH-MAIN' } },
    update: {},
    create: { organizationId: organization.id, name: 'Main Warehouse', code: 'WH-MAIN', address: '500 Logistics Dr' },
  });
  const coldWarehouse = await prisma.warehouse.upsert({
    where: { organizationId_code: { organizationId: organization.id, code: 'WH-COLD' } },
    update: {},
    create: { organizationId: organization.id, name: 'Cold Storage', code: 'WH-COLD', address: '500 Logistics Dr (Bldg B)' },
  });

  await seedOpeningBalance({ organizationId: organization.id, warehouseId: warehouse.id, productId: solvent.id, variantId: solvent5L.id, quantity: '150', userId: user.id, sequence: 1, reorderPoint: '25', reorderQty: '50' });
  await seedOpeningBalance({ organizationId: organization.id, warehouseId: warehouse.id, productId: solvent.id, variantId: solvent20L.id, quantity: '25', userId: user.id, sequence: 2, reorderPoint: '10', reorderQty: '20' });
  await seedOpeningBalance({ organizationId: organization.id, warehouseId: warehouse.id, productId: aluminum.id, variantId: aluminum2mm.id, quantity: '15', userId: user.id, sequence: 3, reorderPoint: '20', reorderQty: '50' });
  await seedOpeningBalance({ organizationId: organization.id, warehouseId: warehouse.id, productId: bearing.id, variantId: bearingKit.id, quantity: '105', userId: user.id, sequence: 4, reorderPoint: '30', reorderQty: '100' });
  await seedOpeningBalance({ organizationId: organization.id, warehouseId: coldWarehouse.id, productId: solvent.id, variantId: solvent5L.id, quantity: '35.5', userId: user.id, sequence: 5, reorderPoint: '20', reorderQty: '30' });

  console.log('Seed completed successfully');
  console.log('Login: demo@stokku.app / password123');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
