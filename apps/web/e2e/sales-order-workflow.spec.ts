import { expect, test, type Page } from '@playwright/test';
import { loginAsDemoUser, createCustomerViaUi } from './helpers';

const stockRow = (page: Page) =>
  page.getByTestId('stock-row-SOL-200-SOL-200-5L-WH-MAIN');

async function readOnHand(page: Page) {
  const text = await stockRow(page).innerText();
  const match = text.match(/([0-9]+(?:\.[0-9]+)?)\s+on hand/);
  if (!match) throw new Error(`Could not read on-hand quantity from: ${text}`);
  return Number(match[1]);
}

test.describe('Sales order workflow', () => {
  test('confirms without allocation, fulfills, ships once, and closes', async ({ page }) => {
    await loginAsDemoUser(page);
    await page.goto('/stock');
    await expect(stockRow(page)).toBeVisible();
    const beforeStock = await readOnHand(page);

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
    await expect(detailDialog).toContainText('2 @ WH-MAIN');

    await page.goto('/stock');
    await expect(stockRow(page)).toBeVisible();
    await expect(stockRow(page)).toContainText('2 allocated');

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
    await expect(stockRow(page)).toBeVisible();
    await expect.poll(() => readOnHand(page)).toBe(beforeStock - 2);
    await page.reload();
    await expect(stockRow(page)).toBeVisible();
    await expect.poll(() => readOnHand(page)).toBe(beforeStock - 2);

    await page.goto('/sales-orders');
    await page.getByText(/SO-/).first().click();
    const shippedDialog = page.getByRole('dialog').last();
    await shippedDialog.getByRole('button', { name: 'Mark delivered' }).click();
    await expect(shippedDialog).toContainText('DELIVERED');
    await shippedDialog.getByRole('button', { name: 'Close order' }).click();
    await expect(shippedDialog).toContainText('CLOSED');
  });
});
