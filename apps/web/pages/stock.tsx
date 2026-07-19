import { useState } from 'react';
import useSWR from 'swr';
import { FiSearch, FiLayers, FiAlertTriangle } from 'react-icons/fi';
import { api } from '../utils/api';
import { Card, Spinner, Badge } from '@stokku/ui';

const fetcher = (url: string) => api.get<any>(url);

export default function StockPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);

  const params = new URLSearchParams({ page: String(page), limit: '30' });
  if (search) params.set('search', search);
  if (warehouseFilter) params.set('warehouseId', warehouseFilter);
  if (showLowStock) params.set('lowStock', 'true');

  const { data: warehouses } = useSWR<any[]>('/warehouses', fetcher);
  const { data, error, isLoading } = useSWR(`/stock?${params}`, fetcher);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Levels</h1>
          <p className="text-gray-500 text-sm mt-1">View and manage inventory across all warehouses</p>
        </div>
        <button
          onClick={() => { setShowLowStock(!showLowStock); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
            showLowStock ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FiAlertTriangle size={15} />
          Low Stock Only
        </button>
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

      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}</div>
      ) : data?.data?.length > 0 ? (
        <div className="space-y-2">
          {data.data.map((item: any) => (
            <Card key={item.id} className={`p-4 flex items-center justify-between ${item.quantity <= (item.reorderPoint || -1) ? 'bg-amber-50 border-amber-200' : ''}`}>
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.quantity <= (item.reorderPoint || -1) ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-500'}`}>
                  <FiLayers size={20} />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{item.product?.name}{item.variant ? ` (${item.variant.name})` : ''}</div>
                  <div className="text-xs text-gray-400">{item.warehouse?.name} &middot; {item.product?.unit}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className={`text-lg font-bold ${item.available <= 0 ? 'text-red-600' : item.available <= (item.reorderPoint || 0) ? 'text-amber-600' : 'text-gray-900'}`}>
                    {item.available}
                  </div>
                  <div className="text-xs text-gray-400">{item.reserved > 0 ? `${item.reserved} reserved` : 'available'}</div>
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
      ) : (
        <div className="text-center py-16 text-gray-400">
          <FiLayers size={48} className="mx-auto mb-4" />
          <p className="text-lg">No stock levels found</p>
          <p className="text-sm mt-2">Add products to warehouses to see stock levels.</p>
        </div>
      )}
    </div>
  );
}
