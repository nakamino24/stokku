import { expect, test, type Page } from '@playwright/test';
import { loginAsDemoUser, createSupplierViaUi } from './helpers';

const stockRow = (page: Page) =>
  page.getByTestId('stock-row-SOL-200-SOL-200-5L-WH-MAIN');

async function readOnHand(page: Page) {
  const text = await stockRow(page).innerText();
  const match = text.match(/([0-9]+(?:\.[0-9]+)?)\s+on hand/);
  if (!match) throw new Error(`Could not read on-hand quantity from: ${text}`);
  return Number(match[1]);
}

test.describe('Purchase order workflow', () => {
  test('creates, approves, sends, partially receives, and posts accepted stock', async ({ page }) => {
    await loginAsDemoUser(page);
    const beforeStock = await (async () => {
      await page.goto('/stock');
      await expect(stockRow(page)).toBeVisible();
      return readOnHand(page);
    })();

    const supplierName = `E2E Supplier ${Date.now()}`;
    await createSupplierViaUi(page, supplierName);

    await page.goto('/purchase-orders');
    await page.getByRole('button', { name: 'New Purchase Order' }).click();
    const createDialog = page.getByRole('dialog', { name: 'New Purchase Order' });
    await expect(createDialog).toBeVisible();
    await createDialog.getByLabel('Supplier').selectOption({ label: supplierName });
    await createDialog.getByLabel('Product 1').selectOption({ label: 'Industrial Solvent X-200 (SOL-200)' });
    await createDialog.getByLabel('Variant 1').selectOption({ label: '5L Canister' });
    await createDialog.getByLabel('Quantity 1').fill('10');
    await createDialog.getByLabel('Unit price 1').fill('28');
    await createDialog.getByRole('button', { name: 'Create draft' }).click();

    const detailDialog = page.getByRole('dialog').last();
    await expect(detailDialog).toContainText('DRAFT');
    await detailDialog.getByRole('button', { name: 'Submit for approval' }).click();
    await expect(detailDialog).toContainText('PENDING APPROVAL');
    await detailDialog.getByRole('button', { name: 'Approve' }).click();
    await expect(detailDialog).toContainText('APPROVED');
    await detailDialog.getByRole('button', { name: 'Send to supplier' }).click();
    await expect(detailDialog).toContainText('SENT');

    await detailDialog.getByRole('button', { name: 'Post goods receipt' }).click();
    const receiptDialog = page.getByRole('dialog', { name: 'Post Goods Receipt' });
    await receiptDialog.getByLabel('Warehouse').selectOption({ label: 'Main Warehouse (WH-MAIN)' });
    await receiptDialog.locator('input[aria-label^="Received"]').fill('10');
    await receiptDialog.locator('input[aria-label^="Accepted"]').fill('11');
    await receiptDialog.locator('input[aria-label^="Rejected"]').fill('0');
    await receiptDialog.getByRole('button', { name: 'Post receipt' }).click();
    await expect(receiptDialog).toContainText('Accepted quantity cannot exceed');

    await receiptDialog.locator('input[aria-label^="Accepted"]').fill('7');
    await receiptDialog.locator('input[aria-label^="Rejected"]').fill('3');
    const postRequests: string[] = [];
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().includes('/purchase-orders/')) postRequests.push(request.url());
    });
    await receiptDialog.getByRole('button', { name: 'Post receipt' }).dblclick();
    await expect(receiptDialog).not.toBeVisible();
    expect(postRequests).toHaveLength(1);

    const refreshedDetail = page.getByRole('dialog').last();
    await expect(refreshedDetail).toContainText('PARTIALLY RECEIVED');
    await expect(refreshedDetail).toContainText('3');

    await page.goto('/stock');
    await expect(stockRow(page)).toBeVisible();
    await expect.poll(() => readOnHand(page)).toBe(beforeStock + 7);
  });
});
