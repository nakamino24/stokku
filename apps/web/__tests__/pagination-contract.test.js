const { readFileSync } = require('fs')
const { resolve } = require('path')
const { getPaginationItems } = require('../utils/pagination')

describe('WMS pagination contract', () => {
  const root = resolve(__dirname, '..')

  it('keeps every page reachable with a bounded window', () => {
    expect(getPaginationItems(30, 1)).toEqual([1, 2, 'ellipsis', 30])
    expect(getPaginationItems(30, 15)).toEqual([1, 'ellipsis', 14, 15, 16, 'ellipsis', 30])
    expect(getPaginationItems(30, 30)).toEqual([1, 'ellipsis', 29, 30])
  })

  it('wires pagination into all requested pages', () => {
    const pagination = readFileSync(resolve(root, 'components/Pagination.tsx'), 'utf8')
    const purchaseOrders = readFileSync(resolve(root, 'pages/purchase-orders.tsx'), 'utf8')
    const salesOrders = readFileSync(resolve(root, 'pages/sales-orders.tsx'), 'utf8')
    const products = readFileSync(resolve(root, 'pages/products.tsx'), 'utf8')

    expect(pagination).toContain('disabled={page <= 1}')
    expect(pagination).toContain('disabled={page >= totalPages}')
    expect(purchaseOrders).toContain('label="Purchase order pages"')
    expect(salesOrders).toContain('label="Sales order pages"')
    expect(products).toContain('label="Product pages"')
    expect(purchaseOrders).toContain('onPageChange={setPage}')
    expect(salesOrders).toContain('onPageChange={setPage}')
    expect(products).toContain('onPageChange={setPage}')
    expect(purchaseOrders).toContain('setStatusFilter(s); setPage(1)')
    expect(salesOrders).toContain('setStatusFilter(s); setPage(1)')
    expect(products).not.toContain('Math.min(data.pagination.totalPages, 20)')
  })

  it('exposes the returned filter and both delivered actions', () => {
    const salesOrders = readFileSync(resolve(root, 'pages/sales-orders.tsx'), 'utf8')

    expect(salesOrders).toContain("'RETURNED'")
    expect(salesOrders).toContain("status: 'CLOSED'")
    expect(salesOrders).toContain("status: 'RETURNED'")
  })
})
