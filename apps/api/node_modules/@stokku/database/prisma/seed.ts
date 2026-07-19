import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ── User ──
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'demo@stokku.app' },
    update: {},
    create: {
      email: 'demo@stokku.app',
      passwordHash,
      name: 'Demo User',
      emailVerified: true,
      role: 'admin',
    },
  });
  console.log('  ✓ User: demo@stokku.app / password123');

  // ── Workspace ──
  const workspace = await prisma.workspace.upsert({
    where: { id: 'demo-workspace-001' },
    update: { name: 'Demo Company', description: 'Stokku demo workspace' },
    create: {
      id: 'demo-workspace-001',
      name: 'Demo Company',
      description: 'Stokku demo workspace',
      ownerId: user.id,
    },
  });
  console.log('  ✓ Workspace: Demo Company');

  // ── Categories (clean up for re-seeding) ──
  await prisma.stockMovement.deleteMany({ where: { warehouse: { workspaceId: workspace.id } } });
  await prisma.stockLevel.deleteMany({ where: { warehouse: { workspaceId: workspace.id } } });
  await prisma.warehouse.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.productSupplier.deleteMany({ where: { product: { workspaceId: workspace.id } } });
  await prisma.productVariant.deleteMany({ where: { product: { workspaceId: workspace.id } } });
  await prisma.product.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.supplier.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.category.deleteMany({ where: { workspaceId: workspace.id } });

  const catRaw = await prisma.category.create({ data: { workspaceId: workspace.id, name: 'Raw Materials', slug: 'raw-materials', color: '#8B5CF6', sortOrder: 1 } });
  const catChem = await prisma.category.create({ data: { workspaceId: workspace.id, name: 'Chemicals', slug: 'chemicals', parentId: catRaw.id, color: '#A78BFA', sortOrder: 1 } });
  const catMetal = await prisma.category.create({ data: { workspaceId: workspace.id, name: 'Metals', slug: 'metals', parentId: catRaw.id, color: '#C4B5FD', sortOrder: 2 } });
  const catFinished = await prisma.category.create({ data: { workspaceId: workspace.id, name: 'Finished Goods', slug: 'finished-goods', color: '#10B981', sortOrder: 2 } });
  const catEquip = await prisma.category.create({ data: { workspaceId: workspace.id, name: 'Equipment', slug: 'equipment', color: '#F59E0B', sortOrder: 3 } });
  console.log('  ✓ Categories: 5 created');

  function createVariant(productId: string, sku: string, name: string, price: number, costPrice: number, options: Record<string, string>) {
    return prisma.productVariant.create({ data: { productId, sku, name, price, costPrice, options: JSON.stringify(options) } });
  }

  const p1 = await prisma.product.create({ data: {
    workspaceId: workspace.id, categoryId: catChem.id, name: 'Industrial Solvent X-200',
    description: 'High-purity solvent for industrial cleaning applications', baseUom: 'liter',
  }});
  await createVariant(p1.id, 'SOL-200-5L', '5L Canister', 45.00, 28.00, { volume: '5L' });
  await createVariant(p1.id, 'SOL-200-20L', '20L Drum', 150.00, 95.00, { volume: '20L' });

  const p2 = await prisma.product.create({ data: {
    workspaceId: workspace.id, categoryId: catMetal.id, name: 'Aluminum Sheet 6061',
    description: 'T6 tempered aluminum sheet, 4ft x 8ft', baseUom: 'sheet',
  }});
  await createVariant(p2.id, 'AL-6061-1MM', '1mm Thickness', 85.00, 55.00, { thickness: '1mm' });
  await createVariant(p2.id, 'AL-6061-2MM', '2mm Thickness', 120.00, 78.00, { thickness: '2mm' });
  await createVariant(p2.id, 'AL-6061-3MM', '3mm Thickness', 160.00, 105.00, { thickness: '3mm' });

  const p3 = await prisma.product.create({ data: {
    workspaceId: workspace.id, categoryId: catFinished.id, name: 'Precision Bearing Kit',
    description: 'Industrial grade ball bearing kit for rotating machinery', baseUom: 'set',
  }});
  await createVariant(p3.id, 'BRG-6200-KIT', '6200 Series (10pcs)', 220.00, 145.00, { series: '6200', qty: '10' });
  await createVariant(p3.id, 'BRG-6300-KIT', '6300 Series (10pcs)', 280.00, 185.00, { series: '6300', qty: '10' });

  const p4 = await prisma.product.create({ data: {
    workspaceId: workspace.id, categoryId: catEquip.id, name: 'Hydraulic Pump P-100',
    description: 'High-pressure hydraulic pump for industrial systems', baseUom: 'unit',
  }});
  await createVariant(p4.id, 'HP-P100-230V', '230V Standard', 1850.00, 1200.00, { voltage: '230V' });
  await createVariant(p4.id, 'HP-P100-460V', '460V Industrial', 2100.00, 1380.00, { voltage: '460V' });

  const p5 = await prisma.product.create({ data: {
    workspaceId: workspace.id, categoryId: catChem.id, name: 'Polymer Resin R-500',
    description: 'Thermoplastic polymer resin for injection molding', baseUom: 'kg',
  }});
  await createVariant(p5.id, 'RES-R500-25KG', '25KG Bag', 175.00, 110.00, { weight: '25KG' });

  console.log('  ✓ Products: 5 created with 9 variants');

  // ── Suppliers ──
  const s1 = await prisma.supplier.create({ data: {
    workspaceId: workspace.id, name: 'ChemCorp International', email: 'orders@chemcorp.io',
    phone: '+1-555-0100', address: '100 Industrial Blvd, Houston, TX', paymentTerms: 'Net 30', currency: 'USD',
  }});
  const s2 = await prisma.supplier.create({ data: {
    workspaceId: workspace.id, name: 'MetalWorks Supply', email: 'sales@metalworks.net',
    phone: '+1-555-0101', address: '200 Foundry St, Pittsburgh, PA', paymentTerms: 'Net 45', currency: 'USD',
  }});
  const s3 = await prisma.supplier.create({ data: {
    workspaceId: workspace.id, name: 'Precision Parts Ltd', email: 'info@precisionparts.uk',
    phone: '+44-20-5555-0102', address: '50 Engineering Way, Manchester, UK', paymentTerms: 'Net 30', currency: 'GBP',
  }});
  console.log('  ✓ Suppliers: 3 created');

  // ── Product-Supplier Links ──
  const v1 = await prisma.productVariant.findFirstOrThrow({ where: { sku: 'SOL-200-5L' } });
  const v2 = await prisma.productVariant.findFirstOrThrow({ where: { sku: 'SOL-200-20L' } });
  const v3 = await prisma.productVariant.findFirstOrThrow({ where: { sku: 'AL-6061-2MM' } });
  const v4 = await prisma.productVariant.findFirstOrThrow({ where: { sku: 'BRG-6200-KIT' } });
  const v5 = await prisma.productVariant.findFirstOrThrow({ where: { sku: 'HP-P100-230V' } });

  await Promise.all([
    prisma.productSupplier.create({ data: { productId: p1.id, supplierId: s1.id, supplierSku: 'CC-SOL-200', leadTimeDays: 14, unitCost: 26.00, moq: 10 } }),
    prisma.productSupplier.create({ data: { productId: p2.id, supplierId: s2.id, supplierSku: 'MW-AL-6061-2', leadTimeDays: 21, unitCost: 72.00, moq: 5, isPreferred: true } }),
    prisma.productSupplier.create({ data: { productId: p3.id, supplierId: s3.id, supplierSku: 'PP-BRG-6200', leadTimeDays: 28, unitCost: 140.00, moq: 25 } }),
    prisma.productSupplier.create({ data: { productId: p4.id, supplierId: s3.id, supplierSku: 'PP-HP-P100', leadTimeDays: 45, unitCost: 1150.00, moq: 2, isPreferred: true } }),
    prisma.productSupplier.create({ data: { productId: p1.id, supplierId: s2.id, supplierSku: 'MW-SOLV-200', leadTimeDays: 18, unitCost: 30.00, moq: 20 } }),
  ]);
  console.log('  ✓ Product-Supplier links: 5 created');

  // ── Warehouses ──
  const wMain = await prisma.warehouse.create({ data: {
    workspaceId: workspace.id, name: 'Main Warehouse', code: 'WH-MAIN',
    description: 'Primary storage and distribution center', address: '500 Logistics Dr, Dallas, TX',
  }});
  const wCold = await prisma.warehouse.create({ data: {
    workspaceId: workspace.id, name: 'Cold Storage', code: 'WH-COLD',
    description: 'Temperature-controlled storage for chemicals', address: '500 Logistics Dr, Dallas, TX (Bldg B)',
  }});
  console.log('  ✓ Warehouses: 2 created');

  // ── Stock Levels & Movements ──
  const now = new Date();

  await Promise.all([
    createStock(prisma, v1.id, wMain.id, user.id, [
      { qty: 100, type: 'receipt', ref: 'PO-2024-001', time: new Date(now.getTime() - 86400000 * 30) },
      { qty: -15, type: 'shipment', ref: 'SO-2024-010', time: new Date(now.getTime() - 86400000 * 20) },
      { qty: -10, type: 'shipment', ref: 'SO-2024-015', time: new Date(now.getTime() - 86400000 * 10) },
      { qty: 50, type: 'receipt', ref: 'PO-2024-002', time: new Date(now.getTime() - 86400000 * 5) },
      { qty: 25, type: 'adjustment', reason: 'Cycle count correction', time: new Date(now.getTime() - 86400000 * 1) },
    ]),
    createStock(prisma, v2.id, wMain.id, user.id, [
      { qty: 30, type: 'receipt', ref: 'PO-2024-001', time: new Date(now.getTime() - 86400000 * 30) },
      { qty: -5, type: 'shipment', ref: 'SO-2024-011', time: new Date(now.getTime() - 86400000 * 15) },
    ]),
    createStock(prisma, v3.id, wMain.id, user.id, [
      { qty: 50, type: 'receipt', ref: 'PO-2024-003', time: new Date(now.getTime() - 86400000 * 60) },
      { qty: -20, type: 'shipment', ref: 'SO-2024-012', time: new Date(now.getTime() - 86400000 * 25) },
      { qty: -15, type: 'shipment', ref: 'SO-2024-018', time: new Date(now.getTime() - 86400000 * 3) },
    ]),
    createStock(prisma, v4.id, wMain.id, user.id, [
      { qty: 200, type: 'receipt', ref: 'PO-2024-004', time: new Date(now.getTime() - 86400000 * 90) },
      { qty: -40, type: 'shipment', ref: 'SO-2024-005', time: new Date(now.getTime() - 86400000 * 60) },
      { qty: -30, type: 'shipment', ref: 'SO-2024-009', time: new Date(now.getTime() - 86400000 * 30) },
      { qty: -25, type: 'shipment', ref: 'SO-2024-020', time: new Date(now.getTime() - 86400000 * 7) },
    ]),
    createStock(prisma, v5.id, wMain.id, user.id, [
      { qty: 10, type: 'receipt', ref: 'PO-2024-005', time: new Date(now.getTime() - 86400000 * 120) },
      { qty: -2, type: 'shipment', ref: 'SO-2024-003', time: new Date(now.getTime() - 86400000 * 90) },
    ]),
    createStock(prisma, v1.id, wCold.id, user.id, [
      { qty: 40, type: 'receipt', ref: 'PO-2024-001', time: new Date(now.getTime() - 86400000 * 30) },
      { qty: -5, type: 'transfer', ref: 'TR-2024-001', reason: 'Replenish main WH', time: new Date(now.getTime() - 86400000 * 12) },
    ]),
  ]);
  console.log('  ✓ Stock levels & movements: seeded with historical data');
}

async function createStock(
  prisma: PrismaClient,
  variantId: string,
  warehouseId: string,
  userId: string,
  movements: { qty: number; type: string; ref?: string; reason?: string; time: Date }[],
) {
  const totalQty = movements.reduce((sum, m) => sum + m.qty, 0);
  const level = await prisma.stockLevel.create({
    data: {
      variantId,
      warehouseId,
      onHand: totalQty,
      allocated: 0,
      available: totalQty,
      ...(movements.some(m => m.type === 'receipt' && m.qty < 30) ? { reorderPoint: 25, reorderQty: 50 } : {}),
    },
  });

  let runningQty = 0;
  for (const m of movements) {
    runningQty += m.qty;
    await prisma.stockMovement.create({
      data: {
        stockLevelId: level.id,
        variantId,
        warehouseId,
        type: m.type,
        quantity: m.qty,
        reference: m.ref ?? null,
        reason: m.reason ?? null,
        beforeQty: runningQty - m.qty,
        afterQty: runningQty,
        userId,
        createdAt: m.time,
      },
    });
  }
}

main()
  .then(() => {
    console.log('\nSeed completed successfully!');
    console.log('Login: demo@stokku.app / password123');
  })
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
