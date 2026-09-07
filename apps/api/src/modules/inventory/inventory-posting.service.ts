import {
  AdjustmentReasonCode,
  InventoryStatus,
  Prisma,
  StockMovementType,
  prisma,
} from '@stokku/database';
import { AppError } from '../../utils/errors';

export type InventoryTransaction = Prisma.TransactionClient;
export type DecimalInput = Prisma.Decimal.Value;

const ZERO = new Prisma.Decimal(0);

export interface BalanceIdentity {
  organizationId: string;
  warehouseId: string;
  binId?: string | null;
  productId: string;
  variantId?: string | null;
  inventoryStatus?: InventoryStatus;
  lotNumber?: string | null;
  serialNumber?: string | null;
}

export interface InventoryPostInput {
  organizationId: string;
  userId: string;
  balanceId: string;
  type: StockMovementType;
  quantity: DecimalInput;
  onHandDelta?: DecimalInput;
  allocatedDelta?: DecimalInput;
  holdDelta?: DecimalInput;
  sourceDocumentType?: string;
  sourceDocumentId?: string;
  reference?: string;
  idempotencyKey: string;
  correlationId?: string;
  reasonCode?: AdjustmentReasonCode;
  reason?: string;
  note?: string;
  unitPrice?: DecimalInput;
  reversalOfId?: string;
}

function asDecimal(value: DecimalInput | undefined): Prisma.Decimal {
  return value === undefined ? ZERO : new Prisma.Decimal(value);
}

function assertNonNegative(value: Prisma.Decimal, field: string): void {
  if (value.isNegative()) {
    throw AppError.conflict(`Inventory invariant violated: ${field} cannot be negative`);
  }
}

function balanceLockKey(identity: BalanceIdentity): string {
  return [
    identity.organizationId,
    identity.warehouseId,
    identity.binId ?? 'null',
    identity.productId,
    identity.variantId ?? 'null',
    identity.inventoryStatus ?? 'AVAILABLE',
    identity.lotNumber ?? 'null',
    identity.serialNumber ?? 'null',
  ].join(':');
}

export async function withInventoryTransaction<T>(
  operation: (tx: InventoryTransaction) => Promise<T>,
  maxAttempts = 3,
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      const retryable = error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2034' || error.code === 'P2002');
      if (!retryable || attempt === maxAttempts) throw error;
    }
  }

  throw AppError.conflict('Inventory transaction could not be serialized');
}

export const InventoryPostingService = {
  async ensureBalance(tx: InventoryTransaction, identity: BalanceIdentity) {
    const inventoryStatus = identity.inventoryStatus ?? 'AVAILABLE';
    const normalizedIdentity = {
      organizationId: identity.organizationId,
      warehouseId: identity.warehouseId,
      binId: identity.binId ?? null,
      productId: identity.productId,
      variantId: identity.variantId ?? null,
      inventoryStatus,
      lotNumber: identity.lotNumber ?? null,
      serialNumber: identity.serialNumber ?? null,
    };

    // The expression unique index protects the database. The advisory lock also
    // serializes the first creation of a nullable inventory identity.
    const lockKey = balanceLockKey(normalizedIdentity);
    await tx.$queryRaw(Prisma.sql`
      SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))::text AS lock_acquired
    `);

    const existing = await tx.stockLevel.findFirst({ where: normalizedIdentity });
    if (existing) return existing;

    return tx.stockLevel.create({
      data: {
        ...normalizedIdentity,
        onHand: ZERO,
        allocated: ZERO,
        hold: ZERO,
        available: ZERO,
      },
    });
  },

  async post(tx: InventoryTransaction, input: InventoryPostInput) {
    const quantity = asDecimal(input.quantity);
    if (!quantity.isPositive()) throw AppError.badRequest('Inventory transaction quantity must be positive');

    const duplicate = await tx.stockMovement.findUnique({
      where: {
        organizationId_idempotencyKey: {
          organizationId: input.organizationId,
          idempotencyKey: input.idempotencyKey,
        },
      },
    });
    if (duplicate) {
      const balance = await tx.stockLevel.findUniqueOrThrow({ where: { id: duplicate.stockLevelId! } });
      return { movement: duplicate, balance, duplicate: true };
    }

    const balance = await tx.stockLevel.findFirst({
      where: { id: input.balanceId, organizationId: input.organizationId },
    });
    if (!balance) throw AppError.notFound('Inventory balance not found');

    const onHandDelta = asDecimal(input.onHandDelta);
    const allocatedDelta = asDecimal(input.allocatedDelta);
    const holdDelta = asDecimal(input.holdDelta);
    const beforeOnHand = new Prisma.Decimal(balance.onHand);
    const beforeAllocated = new Prisma.Decimal(balance.allocated);
    const beforeHold = new Prisma.Decimal(balance.hold);
    const beforeAvailable = new Prisma.Decimal(balance.available);
    const afterOnHand = beforeOnHand.plus(onHandDelta);
    const afterAllocated = beforeAllocated.plus(allocatedDelta);
    const afterHold = beforeHold.plus(holdDelta);
    const afterAvailable = afterOnHand.minus(afterAllocated).minus(afterHold);

    assertNonNegative(afterOnHand, 'onHand');
    assertNonNegative(afterAllocated, 'allocated');
    assertNonNegative(afterHold, 'hold');
    assertNonNegative(afterAvailable, 'available');

    const updated = await tx.stockLevel.updateMany({
      where: { id: balance.id, organizationId: input.organizationId, version: balance.version },
      data: {
        onHand: afterOnHand,
        allocated: afterAllocated,
        hold: afterHold,
        available: afterAvailable,
        version: { increment: 1 },
      },
    });
    if (updated.count !== 1) {
      throw AppError.conflict('Inventory balance changed concurrently; retry the command');
    }

    const unitPrice = input.unitPrice === undefined ? null : asDecimal(input.unitPrice);
    const movement = await tx.stockMovement.create({
      data: {
        organizationId: input.organizationId,
        type: input.type,
        productId: balance.productId,
        variantId: balance.variantId,
        warehouseId: balance.warehouseId,
        stockLevelId: balance.id,
        quantity,
        onHandDelta,
        allocatedDelta,
        holdDelta,
        beforeOnHand,
        afterOnHand,
        beforeAllocated,
        afterAllocated,
        beforeHold,
        afterHold,
        beforeAvailable,
        afterAvailable,
        unitPrice,
        totalPrice: unitPrice ? unitPrice.times(quantity) : null,
        sourceDocumentType: input.sourceDocumentType,
        sourceDocumentId: input.sourceDocumentId,
        reference: input.reference,
        idempotencyKey: input.idempotencyKey,
        correlationId: input.correlationId,
        reasonCode: input.reasonCode,
        reason: input.reason,
        note: input.note,
        reversalOfId: input.reversalOfId,
        createdById: input.userId,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        action: `INVENTORY_${input.type}`,
        entityType: 'StockMovement',
        entityId: movement.id,
        newValues: JSON.stringify({
          balanceId: balance.id,
          quantity: quantity.toString(),
          onHandDelta: onHandDelta.toString(),
          allocatedDelta: allocatedDelta.toString(),
          holdDelta: holdDelta.toString(),
          sourceDocumentType: input.sourceDocumentType,
          sourceDocumentId: input.sourceDocumentId,
          reasonCode: input.reasonCode,
        }),
      },
    });

    return {
      movement,
      balance: await tx.stockLevel.findUniqueOrThrow({ where: { id: balance.id } }),
      duplicate: false,
    };
  },

  async receive(
    tx: InventoryTransaction,
    input: Omit<InventoryPostInput, 'type' | 'onHandDelta' | 'allocatedDelta' | 'holdDelta'>,
  ) {
    return this.post(tx, { ...input, type: 'RECEIPT', onHandDelta: input.quantity });
  },

  async adjust(
    tx: InventoryTransaction,
    input: Omit<InventoryPostInput, 'type' | 'onHandDelta' | 'allocatedDelta' | 'holdDelta' | 'quantity'> & {
      quantityDelta: DecimalInput;
      reasonCode: AdjustmentReasonCode;
    },
  ) {
    const delta = asDecimal(input.quantityDelta);
    if (delta.isZero()) throw AppError.badRequest('Adjustment quantity must be non-zero');
    return this.post(tx, {
      ...input,
      type: 'ADJUSTMENT',
      quantity: delta.abs(),
      onHandDelta: delta,
    });
  },

  async reverse(
    tx: InventoryTransaction,
    input: {
      organizationId: string;
      userId: string;
      movementId: string;
      idempotencyKey: string;
      reason: string;
    },
  ) {
    const original = await tx.stockMovement.findFirst({
      where: { id: input.movementId, organizationId: input.organizationId },
    });
    if (!original) throw AppError.notFound('Inventory transaction not found');

    const existingReversal = await tx.stockMovement.findFirst({
      where: { reversalOfId: original.id, organizationId: input.organizationId },
    });
    if (existingReversal) return existingReversal;

    const result = await this.post(tx, {
      organizationId: input.organizationId,
      userId: input.userId,
      balanceId: original.stockLevelId!,
      type: 'REVERSAL',
      quantity: original.quantity,
      onHandDelta: original.onHandDelta.negated(),
      allocatedDelta: original.allocatedDelta.negated(),
      holdDelta: original.holdDelta.negated(),
      sourceDocumentType: 'STOCK_MOVEMENT',
      sourceDocumentId: original.id,
      reference: original.reference ?? undefined,
      idempotencyKey: input.idempotencyKey,
      correlationId: original.correlationId ?? undefined,
      reasonCode: 'DATA_CORRECTION',
      reason: input.reason,
      reversalOfId: original.id,
    });
    return result.movement;
  },

  async reconcile(organizationId: string) {
    const [balances, movements] = await Promise.all([
      prisma.stockLevel.findMany({ where: { organizationId } }),
      prisma.stockMovement.findMany({ where: { organizationId }, orderBy: { createdAt: 'asc' } }),
    ]);

    const ledger = new Map<string, { onHand: Prisma.Decimal; allocated: Prisma.Decimal; hold: Prisma.Decimal }>();
    for (const movement of movements) {
      if (!movement.stockLevelId) continue;
      const totals = ledger.get(movement.stockLevelId) ?? { onHand: ZERO, allocated: ZERO, hold: ZERO };
      ledger.set(movement.stockLevelId, {
        onHand: totals.onHand.plus(movement.onHandDelta),
        allocated: totals.allocated.plus(movement.allocatedDelta),
        hold: totals.hold.plus(movement.holdDelta),
      });
    }

    const discrepancies = balances.flatMap((balance) => {
      const totals = ledger.get(balance.id) ?? { onHand: ZERO, allocated: ZERO, hold: ZERO };
      const available = totals.onHand.minus(totals.allocated).minus(totals.hold);
      const matches =
        totals.onHand.equals(balance.onHand) &&
        totals.allocated.equals(balance.allocated) &&
        totals.hold.equals(balance.hold) &&
        available.equals(balance.available);
      return matches
        ? []
        : [{
            balanceId: balance.id,
            stored: {
              onHand: balance.onHand.toString(),
              allocated: balance.allocated.toString(),
              hold: balance.hold.toString(),
              available: balance.available.toString(),
            },
            ledger: {
              onHand: totals.onHand.toString(),
              allocated: totals.allocated.toString(),
              hold: totals.hold.toString(),
              available: available.toString(),
            },
          }];
    });

    return { reconciled: discrepancies.length === 0, balanceCount: balances.length, discrepancies };
  },
};
