const { readFileSync } = require('fs');
const { resolve } = require('path');

describe('warehouse UI contract', () => {
  it('exposes zone and bin management from the warehouse dashboard', () => {
    const warehousesPage = readFileSync(resolve(__dirname, '../pages/warehouses.tsx'), 'utf8');

    expect(warehousesPage).toContain('Create zone');
    expect(warehousesPage).toContain('Add bin');
    expect(warehousesPage).toContain('Manage zones');
  });
});
