import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { FiClipboard, FiCheckCircle, FiX, FiPlus } from 'react-icons/fi';
import { api } from '../utils/api';
import { Card, Button, Badge, Modal } from '@stokku/ui';
import { Pagination } from '../components/Pagination';

interface CycleCount {
  id: string;
  status: 'OPEN' | 'COUNTED' | 'APPROVED' | 'REJECTED';
  warehouseId: string;
  zone?: string;
  bins: string[];
  createdAt?: string;
  warehouse?: { name: string; code: string };
}

interface Paginated<T> { data: T[]; pagination: { page: number; totalPages: number; hasNext: boolean; hasPrev: boolean } }

const fetcher = <T,>(url: string) => api.get<T>(url);

const statusColors: Record<string, string> = {
  OPEN: 'warning',
  COUNTED: 'info',
  APPROVED: 'success',
  REJECTED: 'danger',
};

export default function CycleCountsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (statusFilter) params.set('status', statusFilter);

  const { data, error, isLoading, mutate } = useSWR<Paginated<CycleCount>>(`/cycle-counts?${params}`, fetcher);
  const { data: warehouses } = useSWR<any[]>('/warehouses', fetcher);

  const selected = useMemo(
    () => data?.data.find((item) => item.id === selectedId) ?? null,
    [data, selectedId]
  );

  const recordCount = async (id: string, countedQty: string) => {
    setActionError(null);
    try {
      await api.post(`/cycle-counts/${id}/execute`, { binId: '00000000-0000-0000-0000-000000000000', countedQty });
      await mutate();
      setFeedback('Count recorded.');
      setSelectedId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to record count.');
    }
  };

  const approve = async (id: string, approved: boolean) => {
    setActionError(null);
    try {
      await api.post(`/cycle-counts/${id}/approve`, { approved, reason: approved ? 'Approved after review.' : 'Rejected due to variance.' });
      await mutate();
      setFeedback(approved ? 'Cycle count approved.' : 'Cycle count rejected.');
      setSelectedId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to approve cycle count.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cycle Counts</h1>
          <p className="text-gray-500 text-sm mt-1">Track physical inventory checks and variance review</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)}><FiPlus size={16} /> New count</Button>
      </div>

      <div className="mb-4 flex gap-2 flex-wrap">
        {['', 'OPEN', 'COUNTED', 'APPROVED', 'REJECTED'].map((status) => (
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

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">Failed to load cycle counts</div>}

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map((index) => <div key={index} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}</div>
      ) : data?.data && data.data.length > 0 ? (
        <div className="space-y-2">
          {data.data.map((item) => (
            <Card key={item.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedId(item.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                    <FiClipboard size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{item.zone || 'Warehouse zone'}</div>
                    <div className="text-xs text-gray-500">{item.warehouse?.name || 'Warehouse'} · {item.bins.length} bins</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <div className="font-medium text-gray-900">{item.bins.join(', ') || 'No bins listed'}</div>
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
          <FiClipboard size={48} className="mx-auto mb-4" />
          <p className="text-lg">No cycle counts yet</p>
          <p className="text-sm mt-2">Create a count to reconcile physical inventory.</p>
        </div>
      )}

      {data?.pagination && <Pagination page={page} totalPages={data.pagination.totalPages} onPageChange={setPage} label="Cycle count pages" />}

      {feedback && (
        <div role="status" className="fixed bottom-5 right-5 z-40 rounded-lg bg-emerald-600 px-4 py-3 text-sm text-white shadow-lg">
          {feedback}
          <button aria-label="Dismiss" className="ml-3" onClick={() => setFeedback(null)}><FiX className="inline" /></button>
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Cycle Count" size="lg">
        <CycleCountCreateForm warehouses={warehouses ?? []} onCancel={() => setShowCreate(false)} onCreated={async () => { setShowCreate(false); await mutate(); setFeedback('Cycle count created.'); }} />
      </Modal>

      <Modal open={!!selected} onClose={() => setSelectedId(null)} title="Cycle Count Detail" size="lg">
        {selected && (
          <div className="space-y-5">
            {actionError && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{actionError}</div>}

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500">Warehouse</p>
                <p className="font-semibold text-gray-900">{selected.warehouse?.name || selected.warehouseId}</p>
              </div>
              <Badge variant={(statusColors[selected.status] as any) || 'default'}>{selected.status}</Badge>
            </div>

            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div><span className="text-gray-500">Zone</span><p className="font-medium">{selected.zone || 'All zones'}</p></div>
              <div><span className="text-gray-500">Bins</span><p className="font-medium">{selected.bins.join(', ') || 'Not specified'}</p></div>
            </div>

            <div className="flex flex-wrap gap-2">
              {selected.status === 'OPEN' && (
                <Button size="sm" onClick={() => void recordCount(selected.id, '1')}><FiCheckCircle className="mr-2" />COUNTED</Button>
              )}
              {selected.status === 'COUNTED' && (
                <>
                  <Button size="sm" onClick={() => void approve(selected.id, true)}>APPROVED</Button>
                  <Button size="sm" variant="ghost" onClick={() => void approve(selected.id, false)}>REJECTED</Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function CycleCountCreateForm({ warehouses, onCancel, onCreated }: { warehouses: any[]; onCancel: () => void; onCreated: () => Promise<void> }) {
  const [warehouseId, setWarehouseId] = useState('');
  const [zone, setZone] = useState('');
  const [bins, setBins] = useState('A-01');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!warehouseId || !bins.trim()) {
      setError('Warehouse and at least one bin are required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await api.post('/cycle-counts', {
        warehouseId,
        zone: zone || undefined,
        bins: bins.split(',').map((bin) => bin.trim()).filter(Boolean),
        note: note || undefined,
      });
      await onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create cycle count.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-gray-700">
          Warehouse *
          <select value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 outline-none">
            <option value="">Select warehouse</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>{warehouse.name} ({warehouse.code})</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Zone
          <input value={zone} onChange={(event) => setZone(event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 outline-none" placeholder="A" />
        </label>
      </div>
      <label className="block text-sm font-medium text-gray-700">
        Bin codes
        <input value={bins} onChange={(event) => setBins(event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 outline-none" placeholder="A-01, A-02" />
      </label>
      <label className="block text-sm font-medium text-gray-700">
        Notes
        <textarea value={note} onChange={(event) => setNote(event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 outline-none" rows={3} placeholder="Variance notes" />
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create count'}</Button>
      </div>
    </form>
  );
}
