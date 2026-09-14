import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { FiPackage, FiCheckCircle, FiAlertTriangle, FiX } from 'react-icons/fi';
import { api } from '../utils/api';
import { Card, Button, Badge } from '@stokku/ui';
import { Pagination } from '../components/Pagination';

interface PackTask {
  id: string;
  status: 'READY' | 'CLAIMED' | 'PACKED' | 'EXCEPTION';
  warehouseId: string;
  productId: string;
  variantId?: string | null;
  quantity: string;
  salesOrderId: string;
  salesOrderItemId: string;
  product?: { name: string; sku?: string };
  warehouse?: { name: string; code: string };
  createdAt?: string;
}

interface Paginated<T> { data: T[]; pagination: { page: number; totalPages: number; hasNext: boolean; hasPrev: boolean } }

const fetcher = <T,>(url: string) => api.get<T>(url);

const statusColors: Record<string, string> = {
  READY: 'warning',
  CLAIMED: 'info',
  PACKED: 'success',
  EXCEPTION: 'danger',
};

export default function PackingPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (statusFilter) params.set('status', statusFilter);

  const { data, error, isLoading, mutate } = useSWR<Paginated<PackTask>>(`/packing?${params}`, fetcher);

  const selected = useMemo(
    () => data?.data.find((item) => item.id === selectedId) ?? null,
    [data, selectedId]
  );

  const claim = async (id: string) => {
    setActionError(null);
    try {
      await api.post(`/packing/${id}/claim`);
      await mutate();
      setFeedback('Pack task claimed.');
      setSelectedId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to claim task.');
    }
  };

  const complete = async (id: string) => {
    setActionError(null);
    try {
      await api.post(`/packing/${id}/complete`, { packedQty: '1', cartons: 1 });
      await mutate();
      setFeedback('Packing complete.');
      setSelectedId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to complete packing.');
    }
  };

  const exception = async (id: string) => {
    setActionError(null);
    try {
      await api.post(`/packing/${id}/exception`, { reason: 'Packaging issue' });
      await mutate();
      setFeedback('Packing exception recorded.');
      setSelectedId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to record exception.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Packing</h1>
          <p className="text-gray-500 text-sm mt-1">Pack picked goods and prepare them for shipment</p>
        </div>
      </div>

      <div className="mb-4 flex gap-2 flex-wrap">
        {['', 'READY', 'CLAIMED', 'PACKED', 'EXCEPTION'].map((status) => (
          <button
            key={status}
            onClick={() => { setStatusFilter(status); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              statusFilter === status ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {status || 'All'}
          </button>
        ))}
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">Failed to load packing tasks</div>}

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map((idx) => <div key={idx} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}</div>
      ) : data?.data && data.data.length > 0 ? (
        <div className="space-y-2">
          {data.data.map((item) => (
            <Card key={item.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedId(item.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                    <FiPackage size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{item.product?.name || item.productId}</div>
                    <div className="text-xs text-gray-500">{item.salesOrderId} · {item.warehouse?.name || item.warehouseId}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <div className="font-medium text-gray-900">{item.quantity} units</div>
                    <div className="text-xs text-gray-400">{new Date(item.createdAt ?? Date.now()).toLocaleDateString()}</div>
                  </div>
                  <Badge variant={(statusColors[item.status] as any) || 'default'}>{item.status}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <FiPackage size={48} className="mx-auto mb-4" />
          <p className="text-lg">No packing tasks</p>
          <p className="text-sm mt-2">Picked orders ready for packaging will appear here.</p>
        </div>
      )}

      {data?.pagination && <Pagination page={page} totalPages={data.pagination.totalPages} onPageChange={setPage} label="Packing pages" />}

      {feedback && (
        <div role="status" className="fixed bottom-5 right-5 z-40 rounded-lg bg-emerald-600 px-4 py-3 text-sm text-white shadow-lg">
          {feedback}
          <button aria-label="Dismiss" className="ml-3" onClick={() => setFeedback(null)}><FiX className="inline" /></button>
        </div>
      )}

      <div className="fixed inset-0 pointer-events-none">
        {selected && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl pointer-events-auto border border-slate-200">
            {actionError && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 mb-4">{actionError}</div>}

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Order</p>
                <p className="font-semibold text-gray-900">{selected.salesOrderId}</p>
              </div>
              <Badge variant={(statusColors[selected.status] as any) || 'default'}>{selected.status}</Badge>
            </div>

            <div className="grid gap-2 text-sm sm:grid-cols-2 mt-5">
              <div><span className="text-gray-500">Warehouse</span><p className="font-medium">{selected.warehouse?.name || selected.warehouseId}</p></div>
              <div><span className="text-gray-500">Quantity</span><p className="font-medium">{selected.quantity} units</p></div>
              <div><span className="text-gray-500">Item</span><p className="font-medium">{selected.product?.name || selected.productId}</p></div>
              <div><span className="text-gray-500">Variant</span><p className="font-medium">{selected.variantId || 'Standard'}</p></div>
            </div>

            <div className="flex flex-wrap gap-2 mt-6">
              {selected.status === 'READY' && (
                <Button size="sm" onClick={() => void claim(selected.id)}><FiCheckCircle className="mr-2" />CLAIM</Button>
              )}
              {selected.status === 'CLAIMED' && (
                <>
                  <Button size="sm" onClick={() => void complete(selected.id)}>PACKED</Button>
                  <Button size="sm" variant="ghost" onClick={() => void exception(selected.id)}><FiAlertTriangle className="mr-2" />EXCEPTION</Button>
                </>
              )}
              <Button size="sm" variant="ghost" onClick={() => setSelectedId(null)}>Close</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
