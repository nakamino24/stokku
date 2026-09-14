import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { FiSearch, FiLayers, FiAlertTriangle, FiArrowRight, FiShuffle } from 'react-icons/fi';
import { api } from '../utils/api';
import { Card, Button, Badge } from '@stokku/ui';

const fetcher = (url: string) => api.get<any>(url);

export default function StockPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transfer, setTransfer] = useState({
    productId: '',
    variantId: '',
    fromWarehouseId: '',
    toWarehouseId: '',
    quantity: '1',
    note: '',
  });
  const [transfering, setTransferring] = useState(false);
  const [transferFeedback, setTransferFeedback] = useState<string | null>(null);

  const params = new URLSearchParams({ page: String(page), limit: '30' });
  if (search) params.set('search', search);
  if (warehouseFilter) params.set('warehouseId', warehouseFilter);
  if (showLowStock) params.set('lowStock', 'true');

  const { data: warehouses } = useSWR<any[]>('/warehouses', fetcher);
  const { data, error, isLoading, mutate } = useSWR(`/stock?${params}`, fetcher);
  const { data: movementData } = useSWR('/stock/movements?limit=5', fetcher);

  const transferCandidates = useMemo(
    () => (data?.data ?? []).filter((item: any) => Number(item.available) > 0),
    [data]
  );

  const handleTransfer = async () => {
    if (!transfer.productId || !transfer.fromWarehouseId || !transfer.toWarehouseId || Number(transfer.quantity) <= 0) {
      setTransferFeedback('Choose a product, source warehouse, destination warehouse, and a positive quantity.');
      return;
    }

    if (transfer.fromWarehouseId === transfer.toWarehouseId) {
      setTransferFeedback('Source and destination warehouses must be different.');
      return;
    }

    setTransferring(true);
    setTransferFeedback(null);

    try {
      await api.post('/stock/transfer', {
        productId: transfer.productId,
        variantId: transfer.variantId || null,
        fromWarehouseId: transfer.fromWarehouseId,
        toWarehouseId: transfer.toWarehouseId,
        quantity: transfer.quantity,
        note: transfer.note || undefined,
      });
      setTransfer({
        productId: '',
        variantId: '',
        fromWarehouseId: '',
        toWarehouseId: '',
        quantity: '1',
        note: '',
      });
      setShowTransfer(false);
      setTransferFeedback('Transfer posted successfully.');
      await mutate();
    } catch (err) {
      setTransferFeedback(err instanceof Error ? err.message : 'Unable to transfer stock.');
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Levels</h1>
          <p className="text-gray-500 text-sm mt-1">View and manage inventory across all warehouses</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setShowLowStock(!showLowStock); setPage(1); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
              showLowStock ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FiAlertTriangle size={15} />
            Low Stock Only
          </button>
          <Button variant="primary" onClick={() => setShowTransfer(true)}>
            <FiShuffle size={15} />
            Transfer stock
          </Button>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" placeholder="Search products..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 outline-none" />
        </div>
        <select value={warehouseFilter} onChange={e => { setWarehouseFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 outline-none bg-white">
          <option value="">All Warehouses</option>
          {warehouses?.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">Failed to load stock levels</div>}
      {transferFeedback && (
        <div className="p-3 mb-4 rounded-lg border border-indigo-200 bg-indigo-50 text-sm text-indigo-700">
          {transferFeedback}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}</div>
      ) : data?.data?.length > 0 ? (
        <div className="space-y-4">
          <div className="space-y-2">
            {data.data.map((item: any) => (
              <Card data-testid={`stock-row-${item.product?.sku ?? item.productId}-${item.variant?.sku ?? 'base'}-${item.warehouse?.code ?? item.warehouseId}`} key={item.id} className={`p-4 flex items-center justify-between ${Number(item.available) <= Number(item.reorderPoint ?? -1) ? 'bg-amber-50 border-amber-200' : ''}`}>
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${Number(item.available) <= Number(item.reorderPoint ?? -1) ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-500'}`}>
                    <FiLayers size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{item.product?.name}{item.variant ? ` (${item.variant.name})` : ''}</div>
                    <div className="text-xs text-gray-400">{item.warehouse?.name} &middot; {item.product?.unit}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`text-lg font-bold ${Number(item.available) <= 0 ? 'text-red-600' : Number(item.available) <= Number(item.reorderPoint ?? 0) ? 'text-amber-600' : 'text-gray-900'}`}>
                      {item.available} <span className="sr-only">on hand</span>
                    </div>
                    <div className="text-xs text-gray-400">{Number(item.allocated) > 0 ? `${item.allocated} allocated` : `${item.onHand} on hand`}</div>
                  </div>
                  {item.reorderPoint && (
                    <div className="text-xs text-gray-400 w-16 text-right">
                      Min: {item.reorderPoint}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">Recent inventory activity</h2>
              <span className="text-xs text-gray-500">Latest 5</span>
            </div>
            <div className="mb-3 text-[11px] uppercase tracking-wide text-gray-500">
              Tracks TRANSFER_OUT and TRANSFER_IN inventory events
            </div>

            {movementData?.data?.length ? (
              <div className="space-y-2">
                {movementData.data.map((movement: any) => {
                  const positive = ['RECEIPT', 'TRANSFER_IN', 'RETURN', 'FOUND_STOCK'].includes(movement.type);
                  return (
                    <div key={movement.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${positive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {movement.type}
                          </span>
                          <span className="text-sm font-medium text-gray-800 truncate">{movement.product?.name || movement.productId}</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {movement.warehouse?.name || 'Warehouse'} · {new Date(movement.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className={`text-sm font-semibold ${positive ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {positive ? '+' : '-'}{movement.quantity}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No recent movements yet.</div>
            )}
          </Card>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <FiLayers size={48} className="mx-auto mb-4" />
          <p className="text-lg">No stock levels found</p>
          <p className="text-sm mt-2">Add products to warehouses to see stock levels.</p>
        </div>
      )}

      {showTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowTransfer(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Transfer stock</h2>
                <p className="text-sm text-gray-500">Move available units between warehouses</p>
              </div>
              <Badge variant="default">Inventory transfer</Badge>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <select
                  value={transfer.productId}
                  onChange={(e) => {
                    const selected = transferCandidates.find((item: any) => item.productId === e.target.value) ?? null;
                    setTransfer((current) => ({
                      ...current,
                      productId: e.target.value,
                      variantId: selected?.variantId ?? '',
                      fromWarehouseId: selected?.warehouseId ?? '',
                    }));
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 outline-none"
                >
                  <option value="">Select product</option>
                  {transferCandidates.map((item: any) => (
                    <option key={`${item.productId}-${item.variantId ?? 'base'}-${item.warehouseId}`} value={item.productId}>
                      {item.product?.name || item.productId} ({item.available} available)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From warehouse</label>
                  <select
                    value={transfer.fromWarehouseId}
                    onChange={(e) => setTransfer((current) => ({ ...current, fromWarehouseId: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 outline-none"
                  >
                    <option value="">Select source</option>
                    {warehouses?.map((w: any) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To warehouse</label>
                  <select
                    value={transfer.toWarehouseId}
                    onChange={(e) => setTransfer((current) => ({ ...current, toWarehouseId: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 outline-none"
                  >
                    <option value="">Select destination</option>
                    {warehouses?.map((w: any) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={transfer.quantity}
                    onChange={(e) => setTransfer((current) => ({ ...current, quantity: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <div className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-700 w-full justify-center">
                    <FiArrowRight size={14} />
                    Inventory move
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <textarea
                  value={transfer.note}
                  onChange={(e) => setTransfer((current) => ({ ...current, note: e.target.value }))}
                  rows={2}
                  placeholder="Optional transfer note"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setShowTransfer(false)} disabled={transfering}>Cancel</Button>
              <Button variant="primary" onClick={handleTransfer} disabled={transfering}>
                {transfering ? 'Posting transfer...' : 'Confirm transfer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
