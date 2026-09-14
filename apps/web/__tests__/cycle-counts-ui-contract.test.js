const { readFileSync } = require('fs');
const { resolve } = require('path');

describe('cycle counts UI contract', () => {
  it('exposes the operational cycle count workflow in the web app', () => {
    const cycleCountsPage = readFileSync(resolve(__dirname, '../pages/cycle-counts.tsx'), 'utf8');
    const sidebar = readFileSync(resolve(__dirname, '../components/layout/Sidebar.tsx'), 'utf8');

    expect(cycleCountsPage).toContain('Cycle Counts');
    expect(cycleCountsPage).toContain('COUNTED');
    expect(cycleCountsPage).toContain('APPROVED');
    expect(sidebar).toContain("href: '/cycle-counts'");
  });
});
