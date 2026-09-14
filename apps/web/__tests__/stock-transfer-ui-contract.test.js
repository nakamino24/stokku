const { readFileSync } = require('fs');
const { resolve } = require('path');

describe('stock transfer UI contract', () => {
  it('exposes a warehouse-to-warehouse transfer workflow on the stock page', () => {
    const stockPage = readFileSync(resolve(__dirname, '../pages/stock.tsx'), 'utf8');

    expect(stockPage).toContain('Transfer stock');
    expect(stockPage).toContain('fromWarehouseId');
    expect(stockPage).toContain('toWarehouseId');
    expect(stockPage).toContain('/stock/transfer');
  });
});
