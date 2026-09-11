import { expect, test, type Page } from '@playwright/test';
import { loginAsDemoUser, createCustomerViaUi } from './helpers';

const stockRows = (page: Page) =>
  page.locator('[data-testid^="stock-row-SOL-200-SOL-200-5L-"]');

function readOnHandFromText(text: string) {
  const match = text.match(/([0-9]+(?:\.[0-9]+)?)\s+on hand/);
  if (!match) throw new Error(`Could not read on-hand quantity from: ${text}`);
  return Number(match[1]);
}

async function readOnHand(stockRow: ReturnType<Page['getByTestId']>) {
  return readOnHandFromText(await stockRow.innerText());
}

test.describe('Sales order workflow', () => {
  test('confirms without allocation, fulfills, ships once, and closes', async ({ page }) => {
    await loginAsDemoUser(page);
    await page.goto('/stock');
    await expect(stockRows(page).first()).toBeVisible();
    const stockSnapshots = await stockRows(page).evaluateAll(rows => rows.map(row => ({
      testId: row.getAttribute('data-testid') ?? '',
      text: row.textContent ?? '',
    })));

    const customerName = `E2E Customer ${Date.now()}`;
    await createCustomerViaUi(page, customerName);

    await page.goto('/sales-orders');
    await page.getByRole('button', { name: 'New Sales Order' }).click();
    const createDialog = page.getByRole('dialog', { name: 'New Sales Order' });
    await createDialog.getByLabel('Customer').selectOption({ label: customerName });
    await createDialog.getByLabel('Product 1').selectOption({ label: 'Industrial Solvent X-200 (SOL-200)' });
    await createDialog.getByLabel('Variant 1').selectOption({ label: '5L Canister' });
    await createDialog.getByLabel('Quantity 1').fill('2');
    await createDialog.getByLabel('Unit price 1').fill('45');
    await createDialog.getByRole('button', { name: 'Create draft' }).click();

    const detailDialog = page.getByRole('dialog').last();
    await expect(detailDialog).toContainText('DRAFT');
    await detailDialog.getByRole('button', { name: 'Confirm' }).click();
    await expect(detailDialog).toContainText('CONFIRMED');
    await expect(detailDialog).toContainText('Not allocated');

    await detailDialog.getByRole('button', { name: 'Allocate stock' }).click();
    await expect(detailDialog).toContainText('ALLOCATED');
    const allocationText = await detailDialog.locator('tbody').innerText();
    const warehouseMatch = allocationText.match(/\d+(?:\.\d+)? @ (WH-[A-Z]+)/);
    if (!warehouseMatch) throw new Error(`Could not read allocated warehouse from: ${allocationText}`);
    const selectedStockRow = page.getByTestId(`stock-row-SOL-200-SOL-200-5L-${warehouseMatch[1]}`);
    const selectedSnapshot = stockSnapshots.find(snapshot => snapshot.testId.endsWith(`-${warehouseMatch[1]}`));
    if (!selectedSnapshot) throw new Error(`Could not find stock snapshot for ${warehouseMatch[1]}`);
    const beforeStock = readOnHandFromText(selectedSnapshot.text);
    await expect(detailDialog).toContainText(/2 @ WH-[A-Z]+/);

    await page.goto('/stock');
    await expect(selectedStockRow).toBeVisible();
    await expect(selectedStockRow).toContainText('2 allocated');

    await page.goto('/sales-orders');
    await page.getByText(/SO-/).first().click();
    const fulfillmentDialog = page.getByRole('dialog').last();
    await fulfillmentDialog.getByRole('button', { name: 'Start picking' }).click();
    await expect(fulfillmentDialog).toContainText('PICKING');
    await fulfillmentDialog.getByRole('button', { name: 'Mark picked' }).click();
    await expect(fulfillmentDialog).toContainText('PICKED');
    await fulfillmentDialog.getByRole('button', { name: 'Pack order' }).click();
    await expect(fulfillmentDialog).toContainText('PACKED');
    await fulfillmentDialog.getByRole('button', { name: 'Ship order' }).click();
    await expect(fulfillmentDialog).toContainText('SHIPPED');

    await page.goto('/stock');
    await expect(selectedStockRow).toBeVisible();
    await expect.poll(() => readOnHand(selectedStockRow)).toBe(beforeStock - 2);
    await page.reload();
    await expect(selectedStockRow).toBeVisible();
    await expect.poll(() => readOnHand(selectedStockRow)).toBe(beforeStock - 2);

    await page.goto('/sales-orders');
    await page.getByText(/SO-/).first().click();
    const shippedDialog = page.getByRole('dialog').last();
    await shippedDialog.getByRole('button', { name: 'Mark delivered' }).click();
    await expect(shippedDialog).toContainText('DELIVERED');
    await shippedDialog.getByRole('button', { name: 'Close order' }).click();
    await expect(shippedDialog).toContainText('CLOSED');
  });
});
