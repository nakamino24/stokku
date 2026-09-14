import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { FiSend, FiCheckCircle, FiAlertTriangle, FiX } from 'react-icons/fi';
import { api } from '../utils/api';
import { Card, Button, Badge } from '@stokku/ui';
import { Pagination } from '../components/Pagination';

interface ShipmentTask {
  id: string;
  status: 'READY' | 'POSTED' | 'VOIDED';
  warehouseId: string;
  salesOrderId: string;
  trackingNumber?: string;
  warehouse?: { name: string; code: string };
  createdAt?: string;
}

interface Paginated<T> { data: T[]; pagination: { page: number; totalPages: number; hasNext: boolean; hasPrev: boolean } }

const fetcher = <T,>(url: string) => api.get<T>(url);

const statusColors: Record<string, string> = {
  READY: 'warning',
  POSTED: 'success',
  VOIDED: 'danger',
};

export default function ShipmentPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (statusFilter) params.set('status', statusFilter);

  const { data, error, isLoading, mutate } = useSWR<Paginated<ShipmentTask>>(`/shipment?${params}`, fetcher);

  const selected = useMemo(
    () => data?.data.find((item) => item.id === selectedId) ?? null,
    [data, selectedId]
  );

  const post = async (id: string) => {
    setActionError(null);
    try {
      await api.post(`/shipment/${id}/post`, { trackingNumber: 'TRK-10001', carrier: 'UPS' });
      await mutate();
      setFeedback('Shipment posted.');
      setSelectedId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to post shipment.');
    }
  };

  const voidShipment = async (id: string) => {
    setActionError(null);
    try {
      await api.post(`/shipment/${id}/void`, { reason: 'Customer requested cancellation' });
      await mutate();
      setFeedback('Shipment voided.');
      setSelectedId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to void shipment.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipment</h1>
          <p className="text-gray-500 text-sm mt-1">Post outbound consignments and manage dispatch exceptions</p>
        </div>
      </div>

      <div className="mb-4 flex gap-2 flex-wrap">
        {['', 'READY', 'POSTED', 'VOIDED'].map((status) => (
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

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">Failed to load shipment tasks</div>}

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map((idx) => <div key={idx} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}</div>
      ) : data?.data && data.data.length > 0 ? (
        <div className="space-y-2">
          {data.data.map((item) => (
            <Card key={item.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedId(item.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                    <FiSend size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{item.salesOrderId}</div>
                    <div className="text-xs text-gray-500">{item.warehouse?.name || item.warehouseId}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <div className="font-medium text-gray-900">{item.trackingNumber || 'Awaiting tracking'}</div>
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
          <FiSend size={48} className="mx-auto mb-4" />
          <p className="text-lg">No shipments</p>
          <p className="text-sm mt-2">Packed orders ready for dispatch will appear here.</p>
        </div>
      )}

      {data?.pagination && <Pagination page={page} totalPages={data.pagination.totalPages} onPageChange={setPage} label="Shipment pages" />}

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
                <p className="text-sm text-gray-500">Shipment</p>
                <p className="font-semibold text-gray-900">{selected.salesOrderId}</p>
              </div>
              <Badge variant={(statusColors[selected.status] as any) || 'default'}>{selected.status}</Badge>
            </div>

            <div className="grid gap-2 text-sm sm:grid-cols-2 mt-5">
              <div><span className="text-gray-500">Warehouse</span><p className="font-medium">{selected.warehouse?.name || selected.warehouseId}</p></div>
              <div><span className="text-gray-500">Tracking</span><p className="font-medium">{selected.trackingNumber || 'Not posted'}</p></div>
            </div>

            <div className="flex flex-wrap gap-2 mt-6">
              {selected.status === 'READY' && (
                <Button size="sm" onClick={() => void post(selected.id)}><FiCheckCircle className="mr-2" />POST</Button>
              )}
              {selected.status === 'POSTED' && (
                <Button size="sm" variant="ghost" onClick={() => void voidShipment(selected.id)}><FiAlertTriangle className="mr-2" />VOID</Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setSelectedId(null)}>Close</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
