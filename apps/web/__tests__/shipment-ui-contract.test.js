const { readFileSync } = require('fs');
const { resolve } = require('path');

describe('shipment UI contract', () => {
  it('exposes the outbound shipment workflow in the web app', () => {
    const shipmentPage = readFileSync(resolve(__dirname, '../pages/shipment.tsx'), 'utf8');
    const sidebar = readFileSync(resolve(__dirname, '../components/layout/Sidebar.tsx'), 'utf8');

    expect(shipmentPage).toContain('Shipment');
    expect(shipmentPage).toContain('READY');
    expect(shipmentPage).toContain('POSTED');
    expect(sidebar).toContain("href: '/shipment'");
  });
});
