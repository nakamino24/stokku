const { readFileSync } = require('fs');
const { resolve } = require('path');

describe('receiving UI contract', () => {
  it('exposes the inbound receiving workflow in the web app', () => {
    const receivingPage = readFileSync(resolve(__dirname, '../pages/receiving.tsx'), 'utf8');
    const sidebar = readFileSync(resolve(__dirname, '../components/layout/Sidebar.tsx'), 'utf8');

    expect(receivingPage).toContain('Receiving');
    expect(receivingPage).toContain('DUE');
    expect(receivingPage).toContain('RECEIVED');
    expect(sidebar).toContain("href: '/receiving'");
  });
});
