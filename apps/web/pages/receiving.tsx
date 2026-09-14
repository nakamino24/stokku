import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { FiCheckCircle, FiInbox, FiX } from 'react-icons/fi';
import { api } from '../utils/api';
import { Badge, Button, Card, Modal } from '@stokku/ui';
import { Pagination } from '../components/Pagination';

interface Warehouse { id: string; name: string; code: string }
interface PurchaseOrderItem { id: string; product: { name: string; unit: string }; quantity: string; receivedQty: string }
interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  orderDate: string;
  expectedDate?: string | null;
  supplier: { name: string };
  items: PurchaseOrderItem[];
}
interface Paginated<T> { data: T[]; pagination: { page: number; totalPages: number; hasNext: boolean; hasPrev: boolean } }

const fetcher = <T,>(url: string) => api.get<T>(url);
const statusColors: Record<string, string> = { DUE: 'warning', RECEIVING: 'info', RECEIVED: 'success' };

function receivingStatus(status: string) {
  if (status === 'RECEIVED') return 'RECEIVED';
  if (status === 'PARTIALLY_RECEIVED') return 'RECEIVING';
  return 'DUE';
}

export default function ReceivingPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (statusFilter === 'DUE') params.set('status', 'SENT');
  if (statusFilter === 'RECEIVING') params.set('status', 'PARTIALLY_RECEIVED');
  if (statusFilter === 'RECEIVED') params.set('status', 'RECEIVED');

  const { data, error, isLoading, mutate } = useSWR<Paginated<PurchaseOrder>>(`/purchase-orders?${params}`, fetcher);
  const { data: warehouses } = useSWR<Warehouse[]>('/warehouses', fetcher);

  const openOrder = async (id: string) => {
    setActionError(null);
    try {
      setSelected(await api.get<PurchaseOrder>(`/purchase-orders/${id}`));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to load purchase order.');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Receiving</h1>
        <p className="text-gray-500 text-sm mt-1">Inspect and receive inbound shipments from suppliers</p>
      </div>

      <div className="mb-4 flex gap-2 flex-wrap">
        {['', 'DUE', 'RECEIVING', 'RECEIVED'].map((status) => (
          <button key={status} onClick={() => { setStatusFilter(status); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${statusFilter === status ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
            {status || 'All'}
          </button>
        ))}
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">Failed to load receiving tasks</div>}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((index) => <div key={index} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}</div>
      ) : data?.data?.length ? (
        <div className="space-y-2">
          {data.data.map((order) => {
            const status = receivingStatus(order.status);
            return <Card key={order.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => void openOrder(order.id)}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><FiInbox size={20} /></div>
                  <div><div className="font-semibold text-gray-900">{order.poNumber}</div><div className="text-xs text-gray-500">{order.supplier.name} · {order.items.length} items</div></div>
                </div>
                <div className="flex items-center gap-4"><div className="text-right text-sm"><div className="font-medium text-gray-900">{order.expectedDate ? new Date(order.expectedDate).toLocaleDateString() : 'No due date'}</div><div className="text-xs text-gray-400">Expected delivery</div></div><Badge variant={(statusColors[status] as any) || 'default'}>{status}</Badge></div>
              </div>
            </Card>;
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400"><FiInbox size={48} className="mx-auto mb-4" /><p className="text-lg">No receiving tasks</p><p className="text-sm mt-2">Inbound deliveries due for inspection will appear here.</p></div>
      )}

      {data?.pagination && <Pagination page={page} totalPages={data.pagination.totalPages} onPageChange={setPage} label="Receiving pages" />}
      {feedback && <div role="status" className="fixed bottom-5 right-5 z-40 rounded-lg bg-emerald-600 px-4 py-3 text-sm text-white shadow-lg">{feedback}<button aria-label="Dismiss" className="ml-3" onClick={() => setFeedback(null)}><FiX className="inline" /></button></div>}

      <Modal open={!!selected} onClose={() => { setSelected(null); setActionError(null); }} title={selected?.poNumber || 'Receiving'} size="xl">
        {selected && <ReceivingForm order={selected} warehouses={warehouses ?? []} actionError={actionError} onCancel={() => setSelected(null)} onPosted={async () => { setSelected(null); await mutate(); setFeedback('Goods receipt posted and putaway work created.'); }} onError={setActionError} />}
      </Modal>
    </div>
  );
}

function ReceivingForm({ order, warehouses, actionError, onCancel, onPosted, onError }: { order: PurchaseOrder; warehouses: Warehouse[]; actionError: string | null; onCancel: () => void; onPosted: () => Promise<void>; onError: (message: string | null) => void }) {
  const remaining = useMemo(() => order.items.map((item) => ({ item, quantity: String(Math.max(0, Number(item.quantity) - Number(item.receivedQty))) })), [order.items]);
  const [warehouseId, setWarehouseId] = useState('');
  const [quantities, setQuantities] = useState<Record<string, string>>(() => Object.fromEntries(remaining.map(({ item, quantity }) => [item.id, quantity])));
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const items = remaining.filter(({ item }) => Number(quantities[item.id]) > 0).map(({ item }) => ({ itemId: item.id, receivedQty: quantities[item.id], acceptedQty: quantities[item.id], rejectedQty: '0' }));
    if (!warehouseId || items.length === 0) { onError('Choose a warehouse and enter at least one received quantity.'); return; }
    setSaving(true); onError(null);
    try {
      const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${order.id}-${Date.now()}`;
      await api.post(`/purchase-orders/${order.id}/receive`, { warehouseId, items }, { 'Idempotency-Key': idempotencyKey });
      await onPosted();
    } catch (err) { onError(err instanceof Error ? err.message : 'Unable to post goods receipt.'); } finally { setSaving(false); }
  };

  return <form onSubmit={submit} className="space-y-5">
    {actionError && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{actionError}</div>}
    <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm text-gray-600">Receiving warehouse<select aria-label="Receiving warehouse" value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)} className="field mt-1 w-full"><option value="">Select warehouse</option>{warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name} ({warehouse.code})</option>)}</select></label><div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800"><strong>{order.supplier.name}</strong><br />Posting creates stock and putaway work.</div></div>
    <div className="space-y-2">{remaining.map(({ item }) => <div key={item.id} className="grid gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-[2fr_1fr_1fr] sm:items-center"><div><div className="font-medium text-gray-900">{item.product.name}</div><div className="text-xs text-gray-500">Remaining: {Math.max(0, Number(item.quantity) - Number(item.receivedQty))} {item.product.unit}</div></div><span className="text-xs text-gray-500">Accepted quantity</span><input aria-label={`Received ${item.product.name}`} inputMode="decimal" value={quantities[item.id] ?? '0'} onChange={(event) => setQuantities((current) => ({ ...current, [item.id]: event.target.value }))} className="field" /></div>)}</div>
    <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Posting...' : <><FiCheckCircle className="mr-2" />Post receipt</>}</Button></div>
  </form>;
}
