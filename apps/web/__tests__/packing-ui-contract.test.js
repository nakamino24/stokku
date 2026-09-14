const { readFileSync } = require('fs');
const { resolve } = require('path');

describe('packing UI contract', () => {
  it('exposes the warehouse packing workflow in the web app', () => {
    const packingPage = readFileSync(resolve(__dirname, '../pages/packing.tsx'), 'utf8');
    const sidebar = readFileSync(resolve(__dirname, '../components/layout/Sidebar.tsx'), 'utf8');

    expect(packingPage).toContain('Packing');
    expect(packingPage).toContain('READY');
    expect(packingPage).toContain('PACKED');
    expect(sidebar).toContain("href: '/packing'");
  });
});
