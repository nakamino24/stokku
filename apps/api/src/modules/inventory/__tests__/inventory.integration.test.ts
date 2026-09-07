import { randomUUID } from 'crypto';
import { Prisma, prisma } from '@stokku/database';
import { PurchaseOrderService } from '../../purchase-orders/purchase-orders.service';
import { ProductService } from '../../products/products.service';
import { SalesOrderService } from '../../sales-orders/sales-orders.service';
import { StockService } from '../../stock/stock.service';

jest.setTimeout(45_000);

describe('WMS inventory core (PostgreSQL)', () => {
  const suffix = randomUUID();
  const ids: Record<string, string> = {};

  beforeAll(async () => {
    const organization = await prisma.organization.create({
      data: { name: 'Inventory Test Org', slug: `inventory-test-${suffix}` },
    });
    const user = await prisma.user.create({
      data: {
        organizationId: organization.id,
        email: `inventory-${suffix}@example.com`,
        name: 'Inventory Tester',
        role: 'OWNER',
        emailVerified: true,
      },
    });
    await prisma.organization.update({ where: { id: organization.id }, data: { ownerId: user.id } });
    const [supplier, customer, warehouseA, warehouseB, product] = await Promise.all([
      prisma.supplier.create({
        data: { organizationId: organization.id, name: 'Test Supplier' },
      }),
      prisma.customer.create({
        data: { organizationId: organization.id, name: 'Test Customer' },
      }),
      prisma.warehouse.create({
        data: { organizationId: organization.id, name: 'Warehouse A', code: `A-${suffix}` },
      }),
      prisma.warehouse.create({
        data: { organizationId: organization.id, name: 'Warehouse B', code: `B-${suffix}` },
      }),
      prisma.product.create({
        data: { organizationId: organization.id, name: 'Fractional Material', sku: `MAT-${suffix}`, unit: 'kg' },
      }),
    ]);
    Object.assign(ids, {
      organization: organization.id,
      user: user.id,
      supplier: supplier.id,
      customer: customer.id,
      warehouseA: warehouseA.id,
      warehouseB: warehouseB.id,
      product: product.id,
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('receives 40 + 60, derives PO state, rejects over-receipt, and deduplicates retries', async () => {
    const order = await PurchaseOrderService.create(ids.organization, ids.user, {
      supplierId: ids.supplier,
      items: [{ productId: ids.product, quantity: '100', unitPrice: '2.125' }],
    });
    await PurchaseOrderService.updateStatus(ids.organization, ids.user, order.id, 'PENDING_APPROVAL');
    await PurchaseOrderService.updateStatus(ids.organization, ids.user, order.id, 'APPROVED');
    await PurchaseOrderService.updateStatus(ids.organization, ids.user, order.id, 'SENT');

    const firstInput = {
      warehouseId: ids.warehouseA,
      idempotencyKey: `receipt-40-${suffix}`,
      items: [{ itemId: order.items[0].id, receivedQty: '40' }],
    };
    const first = await PurchaseOrderService.receive(ids.organization, ids.user, order.id, firstInput);
    expect(first.purchaseOrder.status).toBe('PARTIALLY_RECEIVED');

    const duplicate = await PurchaseOrderService.receive(ids.organization, ids.user, order.id, firstInput);
    expect(duplicate.id).toBe(first.id);
    const afterDuplicate = await prisma.stockLevel.findFirstOrThrow({
      where: { organizationId: ids.organization, productId: ids.product, warehouseId: ids.warehouseA },
    });
    expect(afterDuplicate.onHand.equals(new Prisma.Decimal('40'))).toBe(true);

    await expect(PurchaseOrderService.receive(ids.organization, ids.user, order.id, {
      warehouseId: ids.warehouseA,
      idempotencyKey: `receipt-over-${suffix}`,
      items: [{ itemId: order.items[0].id, receivedQty: '61' }],
    })).rejects.toThrow('exceeds ordered quantity');

    const final = await PurchaseOrderService.receive(ids.organization, ids.user, order.id, {
      warehouseId: ids.warehouseA,
      idempotencyKey: `receipt-60-${suffix}`,
      items: [{ itemId: order.items[0].id, receivedQty: '60' }],
    });
    expect(final.purchaseOrder.status).toBe('RECEIVED');
    const balance = await prisma.stockLevel.findFirstOrThrow({
      where: { organizationId: ids.organization, productId: ids.product, warehouseId: ids.warehouseA },
    });
    expect(balance.onHand.equals(new Prisma.Decimal('100'))).toBe(true);
    expect(balance.available.equals(new Prisma.Decimal('100'))).toBe(true);
    expect(await prisma.goodsReceipt.count({ where: { purchaseOrderId: order.id } })).toBe(2);
  });

  test('DRAFT has no effect, exact multi-warehouse allocation is released on cancellation', async () => {
    await StockService.adjust(ids.organization, ids.user, {
      productId: ids.product,
      warehouseId: ids.warehouseB,
      quantity: '50.5',
      reasonCode: 'FOUND_STOCK',
      idempotencyKey: `opening-b-${suffix}`,
    });
    const draft = await SalesOrderService.create(ids.organization, ids.user, {
      customerId: ids.customer,
      items: [{ productId: ids.product, quantity: '10', unitPrice: '4.25' }],
    });
    expect(draft.status).toBe('DRAFT');
    expect(await prisma.inventoryAllocation.count({ where: { salesOrderId: draft.id } })).toBe(0);

    const allocated = await SalesOrderService.updateStatus(ids.organization, ids.user, draft.id, 'CONFIRMED');
    expect(allocated.status).toBe('ALLOCATED');
    const allocations = await prisma.inventoryAllocation.findMany({ where: { salesOrderId: draft.id } });
    const allocatedTotal = allocations.reduce(
      (sum, allocation) => sum.plus(allocation.quantity),
      new Prisma.Decimal(0),
    );
    expect(allocatedTotal.equals(new Prisma.Decimal('10'))).toBe(true);
    expect(new Set(allocations.map((allocation) => allocation.stockLevelId)).size).toBe(allocations.length);

    await SalesOrderService.updateStatus(ids.organization, ids.user, draft.id, 'CANCELLED');
    expect(await prisma.inventoryAllocation.count({
      where: { salesOrderId: draft.id, status: 'ACTIVE' },
    })).toBe(0);
    const aggregate = await prisma.stockLevel.aggregate({
      where: { organizationId: ids.organization, productId: ids.product },
      _sum: { allocated: true },
    });
    expect(aggregate._sum.allocated?.isZero()).toBe(true);
  });

  test('shipment relieves physical stock once and delivery is status-only', async () => {
    const draft = await SalesOrderService.create(ids.organization, ids.user, {
      customerId: ids.customer,
      items: [{ productId: ids.product, quantity: '10.25', unitPrice: '4.25' }],
    });
    await SalesOrderService.updateStatus(ids.organization, ids.user, draft.id, 'CONFIRMED');
    await SalesOrderService.updateStatus(ids.organization, ids.user, draft.id, 'PICKING');
    await SalesOrderService.updateStatus(ids.organization, ids.user, draft.id, 'PICKED');
    await SalesOrderService.updateStatus(ids.organization, ids.user, draft.id, 'PACKED');
    const before = await prisma.stockLevel.aggregate({
      where: { organizationId: ids.organization, productId: ids.product },
      _sum: { onHand: true },
    });

    const shipped = await SalesOrderService.updateStatus(ids.organization, ids.user, draft.id, 'SHIPPED');
    expect(shipped.status).toBe('SHIPPED');
    const afterShipment = await prisma.stockLevel.aggregate({
      where: { organizationId: ids.organization, productId: ids.product },
      _sum: { onHand: true },
    });
    expect(before._sum.onHand?.minus(afterShipment._sum.onHand ?? 0).equals(new Prisma.Decimal('10.25'))).toBe(true);

    await SalesOrderService.updateStatus(ids.organization, ids.user, draft.id, 'SHIPPED');
    await SalesOrderService.updateStatus(ids.organization, ids.user, draft.id, 'DELIVERED');
    const afterDelivery = await prisma.stockLevel.aggregate({
      where: { organizationId: ids.organization, productId: ids.product },
      _sum: { onHand: true },
    });
    expect(afterDelivery._sum.onHand?.equals(afterShipment._sum.onHand ?? 0)).toBe(true);
    expect(await prisma.stockMovement.count({
      where: { organizationId: ids.organization, sourceDocumentId: draft.id, type: 'SHIPMENT' },
    })).toBeGreaterThan(0);
  });

  test('two concurrent orders cannot both allocate the last unit', async () => {
    const product = await prisma.product.create({
      data: { organizationId: ids.organization, name: 'Last Unit Product', sku: `LAST-${suffix}` },
    });
    await StockService.adjust(ids.organization, ids.user, {
      productId: product.id,
      warehouseId: ids.warehouseA,
      quantity: '1',
      reasonCode: 'FOUND_STOCK',
      idempotencyKey: `last-unit-${suffix}`,
    });
    const [first, second] = await Promise.all([
      SalesOrderService.create(ids.organization, ids.user, {
        customerId: ids.customer,
        items: [{ productId: product.id, quantity: '1', unitPrice: '1' }],
      }),
      SalesOrderService.create(ids.organization, ids.user, {
        customerId: ids.customer,
        items: [{ productId: product.id, quantity: '1', unitPrice: '1' }],
      }),
    ]);
    const outcomes = await Promise.allSettled([
      SalesOrderService.updateStatus(ids.organization, ids.user, first.id, 'CONFIRMED'),
      SalesOrderService.updateStatus(ids.organization, ids.user, second.id, 'CONFIRMED'),
    ]);
    expect(outcomes.filter((outcome) => outcome.status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome.status === 'rejected')).toHaveLength(1);
    const balance = await prisma.stockLevel.findFirstOrThrow({
      where: { organizationId: ids.organization, productId: product.id },
    });
    expect(balance.allocated.equals(new Prisma.Decimal(1))).toBe(true);
    expect(balance.available.isZero()).toBe(true);
  });

  test('adjustment, reversal, immutability, fractional quantities, and reconciliation hold', async () => {
    const product = await prisma.product.create({
      data: { organizationId: ids.organization, name: 'Counted Liquid', sku: `LIQ-${suffix}`, unit: 'l' },
    });
    await StockService.adjust(ids.organization, ids.user, {
      productId: product.id,
      warehouseId: ids.warehouseA,
      quantity: '12.5',
      reasonCode: 'FOUND_STOCK',
      idempotencyKey: `liquid-open-${suffix}`,
    });
    await StockService.adjust(ids.organization, ids.user, {
      productId: product.id,
      warehouseId: ids.warehouseA,
      quantity: '12.5',
      reasonCode: 'FOUND_STOCK',
      idempotencyKey: `liquid-open-${suffix}`,
    });
    expect(await prisma.stockMovement.count({
      where: { organizationId: ids.organization, idempotencyKey: `ADJUSTMENT:liquid-open-${suffix}` },
    })).toBe(1);
    await StockService.adjust(ids.organization, ids.user, {
      productId: product.id,
      warehouseId: ids.warehouseA,
      quantity: '-5',
      reasonCode: 'COUNT_VARIANCE',
      reason: 'Verified cycle count variance',
      idempotencyKey: `liquid-minus-${suffix}`,
    });
    const adjustment = await prisma.stockMovement.findUniqueOrThrow({
      where: {
        organizationId_idempotencyKey: {
          organizationId: ids.organization,
          idempotencyKey: `ADJUSTMENT:liquid-minus-${suffix}`,
        },
      },
    });
    await StockService.reverseAdjustment(ids.organization, ids.user, adjustment.id, {
      idempotencyKey: `liquid-reverse-${suffix}`,
      reason: 'Approved correction reversal',
    });
    const balance = await prisma.stockLevel.findFirstOrThrow({
      where: { organizationId: ids.organization, productId: product.id },
    });
    expect(balance.onHand.equals(new Prisma.Decimal('12.5'))).toBe(true);
    expect(balance.available.equals(balance.onHand.minus(balance.allocated).minus(balance.hold))).toBe(true);
    await expect(prisma.stockMovement.update({
      where: { id: adjustment.id },
      data: { reason: 'mutation must fail' },
    })).rejects.toThrow();
    await expect(StockService.adjust(ids.organization, ids.user, {
      productId: product.id,
      warehouseId: ids.warehouseA,
      quantity: '-20',
      reasonCode: 'COUNT_VARIANCE',
      idempotencyKey: `negative-block-${suffix}`,
    })).rejects.toThrow('cannot be negative');
    expect((await StockService.reconcile(ids.organization)).reconciled).toBe(true);
  });

  test('cross-organization inventory references are rejected without mutation', async () => {
    const otherOrg = await prisma.organization.create({
      data: { name: 'Other Org', slug: `other-${suffix}` },
    });
    const [otherProduct, otherWarehouse] = await Promise.all([
      prisma.product.create({
        data: { organizationId: otherOrg.id, name: 'Other Product', sku: `OTHER-${suffix}` },
      }),
      prisma.warehouse.create({
        data: { organizationId: otherOrg.id, name: 'Other Warehouse', code: `OTHER-${suffix}` },
      }),
    ]);
    await expect(StockService.adjust(ids.organization, ids.user, {
      productId: otherProduct.id,
      warehouseId: otherWarehouse.id,
      quantity: '1',
      reasonCode: 'FOUND_STOCK',
      idempotencyKey: `cross-org-${suffix}`,
    })).rejects.toThrow('Product not found');
    expect(await prisma.stockLevel.count({
      where: { organizationId: ids.organization, productId: otherProduct.id },
    })).toBe(0);
  });

  test('product updates retain variant identity and archive omitted variants', async () => {
    const created = await ProductService.create(ids.organization, ids.user, {
      name: 'Stable Variant Product',
      sku: `STABLE-${suffix}`,
      variants: [{ name: 'Original', sku: `STABLE-ONE-${suffix}`, unitPrice: '2.5', costPrice: '1.25' }],
    });
    const originalId = created.variants[0].id;
    const updated = await ProductService.update(ids.organization, ids.user, created.id, {
      variants: [
        { id: originalId, name: 'Renamed', sku: `STABLE-ONE-${suffix}`, unitPrice: '2.5', costPrice: '1.25' },
        { name: 'Second', sku: `STABLE-TWO-${suffix}`, unitPrice: '3', costPrice: '1.5' },
      ],
    });
    expect(updated.variants.some((variant) => variant.id === originalId && variant.name === 'Renamed')).toBe(true);
    const second = updated.variants.find((variant) => variant.id !== originalId)!;

    await ProductService.update(ids.organization, ids.user, created.id, {
      variants: [{ id: second.id, name: second.name, sku: second.sku, unitPrice: second.unitPrice, costPrice: second.costPrice }],
    });
    const archivedOriginal = await prisma.productVariant.findUniqueOrThrow({ where: { id: originalId } });
    expect(archivedOriginal.isActive).toBe(false);
  });
});
