import { useState } from 'react';
import useSWR from 'swr';
import { FiPlus, FiFileText } from 'react-icons/fi';
import { api } from '../utils/api';
import { Card, Button, Spinner, Badge } from '@stokku/ui';

const fetcher = (url: string) => api.get<any>(url);

const statusColors: Record<string, string> = {
  DRAFT: 'default', CONFIRMED: 'info', PICKING: 'warning',
  SHIPPING: 'warning', DELIVERED: 'success', CANCELLED: 'danger', RETURNED: 'default',
};

export default function SalesOrdersPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (statusFilter) params.set('status', statusFilter);

  const { data, error, isLoading } = useSWR(`/sales-orders?${params}`, fetcher);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Manage customer orders and fulfillment</p>
        </div>
        <Button variant="primary"><FiPlus size={16} /> New Sales Order</Button>
      </div>

      <div className="mb-4 flex gap-2 flex-wrap">
        {['', 'DRAFT', 'CONFIRMED', 'PICKING', 'SHIPPING', 'DELIVERED', 'CANCELLED'].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              statusFilter === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">Failed to load sales orders</div>}

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}</div>
      ) : data?.data?.length > 0 ? (
        <div className="space-y-2">
          {data.data.map((so: any) => (
            <Card key={so.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-500">
                    <FiFileText size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{so.soNumber}</div>
                    <div className="text-xs text-gray-500">{so.customer?.name} &middot; {new Date(so.orderDate).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <div className="font-semibold text-gray-900">${Number(so.totalAmount).toFixed(2)}</div>
                    <div className="text-xs text-gray-400">{so.items?.length || 0} items</div>
                  </div>
                  <Badge variant={(statusColors[so.status] as any) || 'default'}>{so.status}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <FiFileText size={48} className="mx-auto mb-4" />
          <p className="text-lg">No sales orders yet</p>
          <p className="text-sm mt-2">Create sales orders to manage customer fulfillment.</p>
        </div>
      )}
    </div>
  );
}
