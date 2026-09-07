const { readFileSync } = require('fs');
const { resolve } = require('path');

describe('inventory UI contract', () => {
  it('renders WMS balance fields and shipment lifecycle statuses', () => {
    const stockPage = readFileSync(resolve(__dirname, '../pages/stock.tsx'), 'utf8');
    const salesPage = readFileSync(resolve(__dirname, '../pages/sales-orders.tsx'), 'utf8');

    expect(stockPage).toContain('onHand');
    expect(stockPage).toContain('allocated');
    expect(stockPage).toContain('available');
    expect(stockPage).not.toContain('stock.quantity');
    expect(salesPage).toContain("'SHIPPED'");
    expect(salesPage).toContain("'DELIVERED'");
  });
});
