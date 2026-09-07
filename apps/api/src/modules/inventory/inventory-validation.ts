import { AppError } from '../../utils/errors';
import { InventoryTransaction } from './inventory-posting.service';

export async function validateInventoryIdentity(
  tx: InventoryTransaction,
  input: {
    organizationId: string;
    productId: string;
    variantId?: string | null;
    warehouseId: string;
    binId?: string | null;
  },
): Promise<void> {
  const [product, warehouse] = await Promise.all([
    tx.product.findFirst({ where: { id: input.productId, organizationId: input.organizationId } }),
    tx.warehouse.findFirst({ where: { id: input.warehouseId, organizationId: input.organizationId } }),
  ]);
  if (!product) throw AppError.notFound('Product not found');
  if (!warehouse) throw AppError.notFound('Warehouse not found');

  if (input.variantId) {
    const variant = await tx.productVariant.findFirst({
      where: {
        id: input.variantId,
        productId: input.productId,
        product: { organizationId: input.organizationId },
        isActive: true,
      },
    });
    if (!variant) throw AppError.notFound('Product variant not found');
  }

  if (input.binId) {
    const bin = await tx.warehouseBin.findFirst({
      where: {
        id: input.binId,
        zone: {
          warehouseId: input.warehouseId,
          warehouse: { organizationId: input.organizationId },
        },
      },
    });
    if (!bin) throw AppError.notFound('Warehouse bin not found');
  }
}
