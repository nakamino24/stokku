const { readFileSync } = require('fs');
const { resolve } = require('path');

describe('stock activity UI contract', () => {
  it('exposes recent inventory movement history on the stock page', () => {
    const stockPage = readFileSync(resolve(__dirname, '../pages/stock.tsx'), 'utf8');

    expect(stockPage).toContain('Recent inventory activity');
    expect(stockPage).toContain('/stock/movements');
    expect(stockPage).toContain('TRANSFER_OUT');
    expect(stockPage).toContain('TRANSFER_IN');
  });
});
