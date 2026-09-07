import { DocumentType } from '@stokku/database';
import { InventoryTransaction } from './inventory-posting.service';

const PREFIX: Record<DocumentType, string> = {
  PURCHASE_ORDER: 'PO',
  SALES_ORDER: 'SO',
  GOODS_RECEIPT: 'GRN',
  STOCK_TRANSFER: 'TR',
  STOCK_ADJUSTMENT: 'ADJ',
};

export const DocumentSequenceService = {
  async next(
    tx: InventoryTransaction,
    organizationId: string,
    documentType: DocumentType,
    date = new Date(),
  ): Promise<string> {
    const year = date.getUTCFullYear();
    const sequence = await tx.documentSequence.upsert({
      where: {
        organizationId_documentType_year: { organizationId, documentType, year },
      },
      update: { lastNumber: { increment: 1 } },
      create: { organizationId, documentType, year, lastNumber: 1 },
    });

    return `${PREFIX[documentType]}-${year}-${String(sequence.lastNumber).padStart(6, '0')}`;
  },
};
