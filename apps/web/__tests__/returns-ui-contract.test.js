const { readFileSync } = require('fs');
const { resolve } = require('path');

describe('returns UI contract', () => {
  it('exposes the outbound returns workflow in the web app', () => {
    const returnsPage = readFileSync(resolve(__dirname, '../pages/returns.tsx'), 'utf8');
    const sidebar = readFileSync(resolve(__dirname, '../components/layout/Sidebar.tsx'), 'utf8');

    expect(returnsPage).toContain('Returns');
    expect(returnsPage).toContain('Return requests');
    expect(returnsPage).toContain('APPROVED');
    expect(returnsPage).toContain('COMPLETE');
    expect(sidebar).toContain("href: '/returns'");
  });
});
