const { readFileSync } = require('fs');
const { resolve } = require('path');

describe('picking UI contract', () => {
  it('exposes the warehouse picking workflow in the web app', () => {
    const pickingPage = readFileSync(resolve(__dirname, '../pages/picking.tsx'), 'utf8');
    const sidebar = readFileSync(resolve(__dirname, '../components/layout/Sidebar.tsx'), 'utf8');

    expect(pickingPage).toContain('Picking');
    expect(pickingPage).toContain('READY');
    expect(pickingPage).toContain('CLAIMED');
    expect(sidebar).toContain("href: '/picking'");
  });
});
