const { readFileSync } = require('fs');
const { resolve } = require('path');

describe('putaway UI contract', () => {
  it('exposes the warehouse putaway workflow in the web app', () => {
    const putawayPage = readFileSync(resolve(__dirname, '../pages/putaway.tsx'), 'utf8');
    const sidebar = readFileSync(resolve(__dirname, '../components/layout/Sidebar.tsx'), 'utf8');

    expect(putawayPage).toContain('Putaway');
    expect(putawayPage).toContain('READY');
    expect(putawayPage).toContain('CLAIMED');
    expect(sidebar).toContain("href: '/putaway'");
  });
});
