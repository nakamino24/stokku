import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { FiArrowLeftCircle, FiCheckCircle, FiPackage, FiRefreshCcw, FiX } from 'react-icons/fi';
import { api } from '../utils/api';
import { Card, Button, Badge, Modal } from '@stokku/ui';
import { Pagination } from '../components/Pagination';

interface ReturnRequest {
  id: string;
  status: 'OPEN' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
  salesOrderId: string;
  warehouseId: string;
  quantity: string;
  reason: string;
  note?: string | null;
  createdAt?: string;
  warehouse?: { name: string; code: string };
  salesOrder?: { soNumber: string; customer?: { name: string } };
}

interface Paginated<T> { data: T[]; pagination: { page: number; totalPages: number; hasNext: boolean; hasPrev: boolean } }

const fetcher = <T,>(url: string) => api.get<T>(url);

const statusColors: Record<string, string> = {
  OPEN: 'warning',
  APPROVED: 'info',
  COMPLETED: 'success',
  REJECTED: 'danger',
};

export default function ReturnsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (statusFilter) params.set('status', statusFilter);

  const { data, error, isLoading, mutate } = useSWR<Paginated<ReturnRequest>>(`/returns?${params}`, fetcher);

  const selected = useMemo(
    () => data?.data.find((item) => item.id === selectedId) ?? null,
    [data, selectedId]
  );

  const approve = async (id: string, approved: boolean) => {
    setActionError(null);
    try {
      await api.post(`/returns/${id}/approve`, { approved, note: approved ? 'Approved for return processing.' : 'Return request rejected.' });
      await mutate();
      setFeedback(approved ? 'Return approved.' : 'Return rejected.');
      setSelectedId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to update return status.');
    }
  };

  const complete = async (id: string) => {
    setActionError(null);
    try {
      await api.post(`/returns/${id}/complete`, { disposition: 'RESTOCK' });
      await mutate();
      setFeedback('Return completed and stock restocked.');
      setSelectedId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to complete return.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Returns</h1>
          <p className="text-gray-500 text-sm mt-1">Return requests</p>
          <p className="text-gray-500 text-sm mt-1">Manage outbound return requests and disposition</p>
        </div>
      </div>

      <div className="mb-4 flex gap-2 flex-wrap">
        {['', 'OPEN', 'APPROVED', 'COMPLETED', 'REJECTED'].map((status) => (
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

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">Failed to load return requests</div>}

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map((index) => <div key={index} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}</div>
      ) : data?.data && data.data.length > 0 ? (
        <div className="space-y-2">
          {data.data.map((item) => (
            <Card key={item.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedId(item.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                    <FiArrowLeftCircle size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{item.salesOrder?.soNumber || 'Return request'}</div>
                    <div className="text-xs text-gray-500">{item.salesOrder?.customer?.name || 'Customer'} · {item.warehouse?.name || 'Warehouse'} · {item.reason}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <div className="font-semibold text-gray-900">{item.quantity} units</div>
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
          <p className="text-lg">No return requests yet</p>
          <p className="text-sm mt-2">Customer returns will appear here once logged.</p>
        </div>
      )}

      {data?.pagination && <Pagination page={page} totalPages={data.pagination.totalPages} onPageChange={setPage} label="Return pages" />}

      {feedback && (
        <div role="status" className="fixed bottom-5 right-5 z-40 rounded-lg bg-emerald-600 px-4 py-3 text-sm text-white shadow-lg">
          {feedback}
          <button aria-label="Dismiss" className="ml-3" onClick={() => setFeedback(null)}><FiX className="inline" /></button>
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelectedId(null)} title={selected ? `Return request` : 'Return request'} size="lg">
        {selected && (
          <div className="space-y-5">
            {actionError && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{actionError}</div>}

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500">Order</p>
                <p className="font-semibold text-gray-900">{selected.salesOrder?.soNumber || selected.salesOrderId}</p>
              </div>
              <Badge variant={(statusColors[selected.status] as any) || 'default'}>{selected.status}</Badge>
            </div>

            <div className="grid gap-2 text-sm sm:grid-cols-3">
              <div><span className="text-gray-500">Warehouse</span><p className="font-medium">{selected.warehouse?.name || selected.warehouseId}</p></div>
              <div><span className="text-gray-500">Quantity</span><p className="font-medium">{selected.quantity} units</p></div>
              <div><span className="text-gray-500">Reason</span><p className="font-medium">{selected.reason}</p></div>
            </div>

            {selected.note && <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">{selected.note}</div>}

            <div className="flex flex-wrap gap-2">
              {selected.status === 'OPEN' && (
                <>
                  <Button size="sm" onClick={() => void approve(selected.id, true)}><FiCheckCircle className="mr-2" />Approve</Button>
                  <Button size="sm" variant="ghost" onClick={() => void approve(selected.id, false)}><FiX className="mr-2" />Reject</Button>
                </>
              )}
              {selected.status === 'APPROVED' && (
                <Button size="sm" onClick={() => void complete(selected.id)}><FiRefreshCcw className="mr-2" />COMPLETE</Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
