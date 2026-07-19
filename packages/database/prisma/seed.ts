import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const org = await prisma.organization.upsert({
    where: { slug: 'demo-company' },
    update: {},
    create: {
      name: 'Demo Company',
      slug: 'demo-company',
      currency: 'USD',
      timezone: 'UTC',
    },
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
      organizationId: org.id,
    },
  });

  await prisma.organization.update({
    where: { id: org.id },
    data: { ownerId: user.id },
  });

  console.log('  ✓ Organization: Demo Company');
  console.log('  ✓ User: demo@stokku.app / password123');

  // Categories
  const catRaw = await prisma.category.create({ data: { organizationId: org.id, name: 'Raw Materials', slug: 'raw-materials', color: '#8B5CF6', sortOrder: 1 } });
  const catChem = await prisma.category.create({ data: { organizationId: org.id, name: 'Chemicals', slug: 'chemicals', parentId: catRaw.id, color: '#A78BFA', sortOrder: 1 } });
  const catMetal = await prisma.category.create({ data: { organizationId: org.id, name: 'Metals', slug: 'metals', parentId: catRaw.id, color: '#C4B5FD', sortOrder: 2 } });
  const catFinished = await prisma.category.create({ data: { organizationId: org.id, name: 'Finished Goods', slug: 'finished-goods', color: '#10B981', sortOrder: 2 } });
  const catEquip = await prisma.category.create({ data: { organizationId: org.id, name: 'Equipment', slug: 'equipment', color: '#F59E0B', sortOrder: 3 } });
  console.log('  ✓ Categories: 5 created');

  // Products with variants
  const p1 = await prisma.product.create({ data: { organizationId: org.id, categoryId: catChem.id, name: 'Industrial Solvent X-200', sku: 'SOL-200', description: 'High-purity solvent for industrial cleaning applications', unit: 'l', unitPrice: 45, costPrice: 28 } });
  const v1a = await prisma.productVariant.create({ data: { productId: p1.id, name: '5L Canister', sku: 'SOL-200-5L', unitPrice: 45, costPrice: 28, options: '{"volume":"5L"}' } });
  const v1b = await prisma.productVariant.create({ data: { productId: p1.id, name: '20L Drum', sku: 'SOL-200-20L', unitPrice: 150, costPrice: 95, options: '{"volume":"20L"}' } });

  const p2 = await prisma.product.create({ data: { organizationId: org.id, categoryId: catMetal.id, name: 'Aluminum Sheet 6061', sku: 'AL-6061', description: 'T6 tempered aluminum sheet', unit: 'sheet', unitPrice: 85, costPrice: 55 } });
  const v2b = await prisma.productVariant.create({ data: { productId: p2.id, name: '2mm Thickness', sku: 'AL-6061-2MM', unitPrice: 120, costPrice: 78, options: '{"thickness":"2mm"}' } });

  const p3 = await prisma.product.create({ data: { organizationId: org.id, categoryId: catFinished.id, name: 'Precision Bearing Kit', sku: 'BRG-KIT', description: 'Industrial grade ball bearing kit', unit: 'set', unitPrice: 220, costPrice: 145 } });
  const v3a = await prisma.productVariant.create({ data: { productId: p3.id, name: '6200 Series (10pcs)', sku: 'BRG-6200-KIT', unitPrice: 220, costPrice: 145, options: '{"series":"6200","qty":"10"}' } });

  const p4 = await prisma.product.create({ data: { organizationId: org.id, categoryId: catEquip.id, name: 'Hydraulic Pump P-100', sku: 'HP-P100', description: 'High-pressure hydraulic pump', unit: 'unit', unitPrice: 1850, costPrice: 1200 } });
  const v4a = await prisma.productVariant.create({ data: { productId: p4.id, name: '230V Standard', sku: 'HP-P100-230V', unitPrice: 1850, costPrice: 1200, options: '{"voltage":"230V"}' } });

  await prisma.product.create({ data: { organizationId: org.id, categoryId: catChem.id, name: 'Polymer Resin R-500', sku: 'RES-R500', description: 'Thermoplastic polymer resin', unit: 'kg', unitPrice: 175, costPrice: 110 } });
  // p5 variant (no stock levels referencing it so no variable needed)

  console.log('  ✓ Products: 5 with 9 variants');

  // Suppliers
  const s1 = await prisma.supplier.create({ data: { organizationId: org.id, name: 'ChemCorp International', contactPerson: 'John Smith', email: 'orders@chemcorp.io', phone: '+1-555-0100', address: '100 Industrial Blvd, Houston, TX', paymentTerms: 'Net 30', currency: 'USD' } });
  const s2 = await prisma.supplier.create({ data: { organizationId: org.id, name: 'MetalWorks Supply', contactPerson: 'Jane Doe', email: 'sales@metalworks.net', phone: '+1-555-0101', address: '200 Foundry St, Pittsburgh, PA', paymentTerms: 'Net 45', currency: 'USD' } });
  const s3 = await prisma.supplier.create({ data: { organizationId: org.id, name: 'Precision Parts Ltd', contactPerson: 'Mike Brown', email: 'info@precisionparts.uk', phone: '+44-20-5555-0102', address: '50 Engineering Way, Manchester, UK', paymentTerms: 'Net 30', currency: 'GBP' } });
  console.log('  ✓ Suppliers: 3');

  // Product-Supplier links
  await prisma.productSupplier.createMany({
    data: [
      { productId: p1.id, supplierId: s1.id, supplierSku: 'CC-SOL-200', leadTimeDays: 14, unitCost: 26, moq: 10 },
      { productId: p2.id, supplierId: s2.id, supplierSku: 'MW-AL-6061-2', leadTimeDays: 21, unitCost: 72, moq: 5, isPreferred: true },
      { productId: p3.id, supplierId: s3.id, supplierSku: 'PP-BRG-6200', leadTimeDays: 28, unitCost: 140, moq: 25 },
      { productId: p4.id, supplierId: s3.id, supplierSku: 'PP-HP-P100', leadTimeDays: 45, unitCost: 1150, moq: 2, isPreferred: true },
      { productId: p1.id, supplierId: s2.id, supplierSku: 'MW-SOLV-200', leadTimeDays: 18, unitCost: 30, moq: 20 },
    ],
  });
  console.log('  ✓ Product-Supplier links: 5');

  // Customers
  await prisma.customer.create({ data: { organizationId: org.id, name: 'Acme Corp', email: 'orders@acme.com', phone: '+1-555-0200', address: '500 Main St, New York, NY' } });
  await prisma.customer.create({ data: { organizationId: org.id, name: 'Global Industries', email: 'purchasing@globalind.com', phone: '+1-555-0201', address: '1000 Park Ave, Chicago, IL' } });
  await prisma.customer.create({ data: { organizationId: org.id, name: 'TechStart Inc', email: 'info@techstart.io', phone: '+1-555-0202', address: '200 Innovation Dr, San Francisco, CA' } });
  console.log('  ✓ Customers: 3');

  // Warehouses
  const wMain = await prisma.warehouse.create({ data: { organizationId: org.id, name: 'Main Warehouse', code: 'WH-MAIN', description: 'Primary storage and distribution', address: '500 Logistics Dr, Dallas, TX' } });
  const wCold = await prisma.warehouse.create({ data: { organizationId: org.id, name: 'Cold Storage', code: 'WH-COLD', description: 'Temperature-controlled storage', address: '500 Logistics Dr, Dallas, TX (Bldg B)' } });
  console.log('  ✓ Warehouses: 2');

  // Warehouse zones
  const z1 = await prisma.warehouseZone.create({ data: { warehouseId: wMain.id, name: 'Aisle A', code: 'A', description: 'Main aisle - high turnover' } });
  const z2 = await prisma.warehouseZone.create({ data: { warehouseId: wMain.id, name: 'Aisle B', code: 'B', description: 'Secondary aisle - bulk storage' } });
  await prisma.warehouseBin.createMany({
    data: [
      { zoneId: z1.id, code: 'A-01', maxCapacity: 100 }, { zoneId: z1.id, code: 'A-02', maxCapacity: 100 },
      { zoneId: z2.id, code: 'B-01', maxCapacity: 50 }, { zoneId: z2.id, code: 'B-02', maxCapacity: 50 },
    ],
  });
  console.log('  ✓ Warehouse zones & bins');

  // Stock levels
  const now = new Date();

  const sl1 = await prisma.stockLevel.create({ data: { organizationId: org.id, warehouseId: wMain.id, productId: p1.id, variantId: v1a.id, quantity: 150, available: 150, reorderPoint: 25, reorderQty: 50 } });
  const sl2 = await prisma.stockLevel.create({ data: { organizationId: org.id, warehouseId: wMain.id, productId: p1.id, variantId: v1b.id, quantity: 25, available: 25, reorderPoint: 10, reorderQty: 20 } });
  const sl3 = await prisma.stockLevel.create({ data: { organizationId: org.id, warehouseId: wMain.id, productId: p2.id, variantId: v2b.id, quantity: 15, available: 15, reorderPoint: 20, reorderQty: 50 } });
  const sl4 = await prisma.stockLevel.create({ data: { organizationId: org.id, warehouseId: wMain.id, productId: p3.id, variantId: v3a.id, quantity: 105, available: 105, reorderPoint: 30, reorderQty: 100 } });
  const sl5 = await prisma.stockLevel.create({ data: { organizationId: org.id, warehouseId: wMain.id, productId: p4.id, variantId: v4a.id, quantity: 8, available: 8, reorderPoint: 3, reorderQty: 5 } });
  const sl6 = await prisma.stockLevel.create({ data: { organizationId: org.id, warehouseId: wCold.id, productId: p1.id, variantId: v1a.id, quantity: 35, available: 35, reorderPoint: 20, reorderQty: 30 } });

  // Stock movements
  const movs: { stockLevelId: string; productId: string; variantId: string; warehouseId: string; type: any; quantity: number; beforeQty: number; afterQty: number; reference: string; createdById: string; createdAt: Date }[] = [
    { stockLevelId: sl1.id, productId: p1.id, variantId: v1a.id, warehouseId: wMain.id, type: 'IN', quantity: 100, beforeQty: 0, afterQty: 100, reference: 'PO-00001', createdById: user.id, createdAt: new Date(now.getTime() - 86400000 * 30) },
    { stockLevelId: sl1.id, productId: p1.id, variantId: v1a.id, warehouseId: wMain.id, type: 'OUT', quantity: -15, beforeQty: 100, afterQty: 85, reference: 'SO-00001', createdById: user.id, createdAt: new Date(now.getTime() - 86400000 * 20) },
    { stockLevelId: sl1.id, productId: p1.id, variantId: v1a.id, warehouseId: wMain.id, type: 'OUT', quantity: -10, beforeQty: 85, afterQty: 75, reference: 'SO-00002', createdById: user.id, createdAt: new Date(now.getTime() - 86400000 * 10) },
    { stockLevelId: sl1.id, productId: p1.id, variantId: v1a.id, warehouseId: wMain.id, type: 'IN', quantity: 75, beforeQty: 75, afterQty: 150, reference: 'PO-00002', createdById: user.id, createdAt: new Date(now.getTime() - 86400000 * 5) },
    { stockLevelId: sl2.id, productId: p1.id, variantId: v1b.id, warehouseId: wMain.id, type: 'IN', quantity: 30, beforeQty: 0, afterQty: 30, reference: 'PO-00001', createdById: user.id, createdAt: new Date(now.getTime() - 86400000 * 30) },
    { stockLevelId: sl2.id, productId: p1.id, variantId: v1b.id, warehouseId: wMain.id, type: 'OUT', quantity: -5, beforeQty: 30, afterQty: 25, reference: 'SO-00003', createdById: user.id, createdAt: new Date(now.getTime() - 86400000 * 15) },
    { stockLevelId: sl3.id, productId: p2.id, variantId: v2b.id, warehouseId: wMain.id, type: 'IN', quantity: 50, beforeQty: 0, afterQty: 50, reference: 'PO-00003', createdById: user.id, createdAt: new Date(now.getTime() - 86400000 * 60) },
    { stockLevelId: sl3.id, productId: p2.id, variantId: v2b.id, warehouseId: wMain.id, type: 'OUT', quantity: -20, beforeQty: 50, afterQty: 30, reference: 'SO-00004', createdById: user.id, createdAt: new Date(now.getTime() - 86400000 * 25) },
    { stockLevelId: sl3.id, productId: p2.id, variantId: v2b.id, warehouseId: wMain.id, type: 'OUT', quantity: -15, beforeQty: 30, afterQty: 15, reference: 'SO-00005', createdById: user.id, createdAt: new Date(now.getTime() - 86400000 * 3) },
    { stockLevelId: sl4.id, productId: p3.id, variantId: v3a.id, warehouseId: wMain.id, type: 'IN', quantity: 200, beforeQty: 0, afterQty: 200, reference: 'PO-00004', createdById: user.id, createdAt: new Date(now.getTime() - 86400000 * 90) },
    { stockLevelId: sl4.id, productId: p3.id, variantId: v3a.id, warehouseId: wMain.id, type: 'OUT', quantity: -40, beforeQty: 200, afterQty: 160, reference: 'SO-00006', createdById: user.id, createdAt: new Date(now.getTime() - 86400000 * 60) },
    { stockLevelId: sl4.id, productId: p3.id, variantId: v3a.id, warehouseId: wMain.id, type: 'OUT', quantity: -30, beforeQty: 160, afterQty: 130, reference: 'SO-00007', createdById: user.id, createdAt: new Date(now.getTime() - 86400000 * 30) },
    { stockLevelId: sl4.id, productId: p3.id, variantId: v3a.id, warehouseId: wMain.id, type: 'OUT', quantity: -25, beforeQty: 130, afterQty: 105, reference: 'SO-00008', createdById: user.id, createdAt: new Date(now.getTime() - 86400000 * 7) },
    { stockLevelId: sl5.id, productId: p4.id, variantId: v4a.id, warehouseId: wMain.id, type: 'IN', quantity: 10, beforeQty: 0, afterQty: 10, reference: 'PO-00005', createdById: user.id, createdAt: new Date(now.getTime() - 86400000 * 120) },
    { stockLevelId: sl5.id, productId: p4.id, variantId: v4a.id, warehouseId: wMain.id, type: 'OUT', quantity: -2, beforeQty: 10, afterQty: 8, reference: 'SO-00009', createdById: user.id, createdAt: new Date(now.getTime() - 86400000 * 90) },
    { stockLevelId: sl6.id, productId: p1.id, variantId: v1a.id, warehouseId: wCold.id, type: 'IN', quantity: 40, beforeQty: 0, afterQty: 40, reference: 'PO-00001', createdById: user.id, createdAt: new Date(now.getTime() - 86400000 * 30) },
    { stockLevelId: sl6.id, productId: p1.id, variantId: v1a.id, warehouseId: wCold.id, type: 'TRANSFER', quantity: -5, beforeQty: 40, afterQty: 35, reference: 'TR-00001', createdById: user.id, createdAt: new Date(now.getTime() - 86400000 * 12) },
  ];

  await prisma.stockMovement.createMany({ data: movs });
  console.log('  ✓ Stock levels: 6 with 17 movements');

  // System roles
  await prisma.role.createMany({
    data: [
      { organizationId: org.id, name: 'Admin', slug: 'admin', description: 'Full access to all features', isSystem: true },
      { organizationId: org.id, name: 'Inventory Manager', slug: 'inventory_manager', description: 'Manage products, stock, and purchases', isSystem: true },
      { organizationId: org.id, name: 'Warehouse Staff', slug: 'warehouse_staff', description: 'View stock and record movements', isSystem: true },
      { organizationId: org.id, name: 'Viewer', slug: 'viewer', description: 'Read-only access', isSystem: true },
    ],
  });
  console.log('  ✓ System roles: 4');

  console.log('\nSeed completed successfully!');
  console.log('Login: demo@stokku.app / password123');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
