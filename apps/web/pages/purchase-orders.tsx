import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { FiPlus, FiShoppingCart, FiX } from 'react-icons/fi';
import { api } from '../utils/api';
import { Card, Button, Spinner, Badge, Modal } from '@stokku/ui';

interface Supplier { id: string; name: string; status: string }
interface ProductVariant { id: string; name: string; sku?: string | null; unitPrice: string | number }
interface Product { id: string; name: string; sku?: string | null; unit: string; costPrice: string | number; variants: ProductVariant[] }
interface Warehouse { id: string; name: string; code: string }
interface PurchaseOrderItem { id: string; productId: string; variantId?: string | null; quantity: string; receivedQty: string; unitPrice: string; totalPrice: string; product: { name: string; sku?: string | null; unit: string }; variant?: { name: string; sku?: string | null } | null }
interface GoodsReceipt { id: string; receiptNumber: string; receivedAt: string; supplierDeliveryReference?: string | null; lines: Array<{ purchaseOrderItemId: string; receivedQty: string; acceptedQty: string; rejectedQty: string }> }
interface PurchaseOrder {
  id: string; poNumber: string; status: string; orderDate: string; expectedDate?: string | null; receivedDate?: string | null;
  totalAmount: string; subtotal: string; taxAmount: string; notes?: string | null; supplier: { id: string; name: string };
  items: PurchaseOrderItem[]; goodsReceipts: GoodsReceipt[]; _count?: { items: number };
}
interface Paginated<T> { data: T[]; pagination: { page: number; totalPages: number; hasNext: boolean; hasPrev: boolean } }

const fetcher = <T,>(url: string) => api.get<T>(url);

const statusColors: Record<string, string> = {
  DRAFT: 'default', PENDING_APPROVAL: 'warning', APPROVED: 'info',
  SENT: 'info', PARTIALLY_RECEIVED: 'warning', RECEIVED: 'success', CANCELLED: 'danger',
};

export default function PurchaseOrdersPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (statusFilter) params.set('status', statusFilter);

  const { data, error, isLoading, mutate } = useSWR<Paginated<PurchaseOrder>>(`/purchase-orders?${params}`, fetcher);
  const { data: suppliers } = useSWR<Paginated<Supplier>>('/suppliers?status=ACTIVE&limit=100', fetcher);
  const { data: products } = useSWR<Paginated<Product>>('/products?limit=100', fetcher);
  const { data: warehouseResponse } = useSWR<Warehouse[]>('/warehouses', fetcher);
  const warehouses = warehouseResponse ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);

  const openDetail = async (id: string) => {
    setActionError(null);
    try {
      setSelected(await api.get<PurchaseOrder>(`/purchase-orders/${id}`));
      setSelectedId(id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to load purchase order.');
    }
  };

  const refreshSelected = async (id: string) => {
    const detail = await api.get<PurchaseOrder>(`/purchase-orders/${id}`);
    await mutate((current) => current ? { ...current, data: current.data.map((order) => order.id === id ? detail : order) } : current, { revalidate: true });
    setSelectedId(id);
    setSelected(detail);
  };

  const transition = async (order: PurchaseOrder, status: string) => {
    setActionError(null);
    try {
      await api.patch(`/purchase-orders/${order.id}/status`, { status });
      await refreshSelected(order.id);
      setFeedback(`Purchase order ${status.replace('_', ' ').toLowerCase()}.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to update purchase order.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Manage supplier orders and stock receiving</p>
        </div>
        <Button variant="primary" onClick={() => { setActionError(null); setShowCreate(true); }}><FiPlus size={16} /> New Purchase Order</Button>
      </div>

      <div className="mb-4 flex gap-2">
        {['', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              statusFilter === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">Failed to load purchase orders</div>}

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}</div>
      ) : data?.data && data.data.length > 0 ? (
        <div className="space-y-2">
            {data.data.map((po) => (
            <Card key={po.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => void openDetail(po.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                    <FiShoppingCart size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{po.poNumber}</div>
                    <div className="text-xs text-gray-500">{po.supplier?.name} &middot; {new Date(po.orderDate).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <div className="font-semibold text-gray-900">${Number(po.totalAmount).toFixed(2)}</div>
                    <div className="text-xs text-gray-400">{po._count?.items || 0} items</div>
                  </div>
                  <Badge variant={(statusColors[po.status] as any) || 'default'}>{po.status.replace('_', ' ')}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <FiShoppingCart size={48} className="mx-auto mb-4" />
          <p className="text-lg">No purchase orders yet</p>
          <p className="text-sm mt-2">Create purchase orders to manage supplier deliveries.</p>
        </div>
      )}

      {feedback && <div role="status" className="fixed bottom-5 right-5 z-40 rounded-lg bg-emerald-600 px-4 py-3 text-sm text-white shadow-lg">{feedback}<button aria-label="Dismiss" className="ml-3" onClick={() => setFeedback(null)}><FiX className="inline" /></button></div>}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Purchase Order" size="xl">
        <PurchaseOrderForm
          suppliers={suppliers?.data ?? []}
          products={products?.data ?? []}
          onCancel={() => setShowCreate(false)}
          onCreated={async (order) => { setShowCreate(false); await mutate(); await openDetail(order.id); setFeedback('Purchase order created as draft.'); }}
        />
      </Modal>

      <Modal open={!!selected} onClose={() => { setSelectedId(null); setSelected(null); }} title={selected ? selected.poNumber : 'Purchase Order'} size="xl">
        {selected && <PurchaseOrderDetail order={selected} actionError={actionError} onAction={transition} onReceive={() => { setActionError(null); setShowReceive(true); }} />}
      </Modal>

      <Modal open={showReceive} onClose={() => setShowReceive(false)} title="Post Goods Receipt" size="lg">
        {selected && <GoodsReceiptForm order={selected} warehouses={warehouses ?? []} onCancel={() => setShowReceive(false)} onPosted={async () => { setShowReceive(false); await refreshSelected(selected.id); setFeedback('Goods receipt posted.'); }} />}
      </Modal>
    </div>
  );
}

interface PurchaseOrderFormProps {
  suppliers: Supplier[];
  products: Product[];
  onCancel: () => void;
  onCreated: (order: PurchaseOrder) => Promise<void>;
}

function PurchaseOrderForm({ suppliers, products, onCancel, onCreated }: PurchaseOrderFormProps) {
  const [supplierId, setSupplierId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [taxRate, setTaxRate] = useState('0');
  const [lines, setLines] = useState([{ productId: '', variantId: '', quantity: '1', unitPrice: '' }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateLine = (index: number, field: 'productId' | 'variantId' | 'quantity' | 'unitPrice', value: string) => setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, [field]: value, ...(field === 'productId' ? { variantId: '' } : {}) } : line));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supplierId || lines.some((line) => !line.productId || !line.quantity || !line.unitPrice)) { setError('Supplier, product, quantity, and unit price are required.'); return; }
    setSaving(true); setError(null);
    try {
      const order = await api.post<PurchaseOrder>('/purchase-orders', { supplierId, expectedDate: expectedDate ? new Date(`${expectedDate}T00:00:00.000Z`).toISOString() : undefined, notes: notes || undefined, taxRate: taxRate || '0', items: lines.map((line) => ({ productId: line.productId, variantId: line.variantId || null, quantity: line.quantity, unitPrice: line.unitPrice })) });
      await onCreated(order);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to create purchase order.'); } finally { setSaving(false); }
  };

  return <form onSubmit={submit} className="space-y-4">
    {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <div className="grid gap-3 sm:grid-cols-3">
      <Field label="Supplier *"><select aria-label="Supplier" value={supplierId} onChange={(event) => setSupplierId(event.target.value)} className="field"><option value="">Select supplier</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></Field>
      <Field label="Expected date"><input aria-label="Expected date" type="date" value={expectedDate} onChange={(event) => setExpectedDate(event.target.value)} className="field" /></Field>
      <Field label="Tax rate"><input aria-label="Tax rate" inputMode="decimal" value={taxRate} onChange={(event) => setTaxRate(event.target.value)} className="field" /></Field>
    </div>
    <Field label="Notes"><textarea aria-label="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} className="field" rows={2} /></Field>
    <div className="space-y-3">
      <div className="flex items-center justify-between"><h3 className="font-semibold text-gray-900">Line items</h3><Button type="button" size="sm" variant="outline" onClick={() => setLines((current) => [...current, { productId: '', variantId: '', quantity: '1', unitPrice: '' }])}>Add line</Button></div>
      {lines.map((line, index) => { const product = products.find((candidate) => candidate.id === line.productId); return <div key={index} className="grid gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-[2fr_1.5fr_1fr_1fr_auto]">
        <select aria-label={`Product ${index + 1}`} value={line.productId} onChange={(event) => { updateLine(index, 'productId', event.target.value); const nextProduct = products.find((candidate) => candidate.id === event.target.value); if (nextProduct) updateLine(index, 'unitPrice', String(nextProduct.costPrice)); }} className="field"><option value="">Select product</option>{products.map((item) => <option key={item.id} value={item.id}>{item.name}{item.sku ? ` (${item.sku})` : ''}</option>)}</select>
        <select aria-label={`Variant ${index + 1}`} value={line.variantId} onChange={(event) => { updateLine(index, 'variantId', event.target.value); const variant = product?.variants.find((candidate) => candidate.id === event.target.value); if (variant) updateLine(index, 'unitPrice', String(variant.unitPrice)); }} className="field" disabled={!product || product.variants.length === 0}><option value="">No variant</option>{product?.variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.name}</option>)}</select>
        <input aria-label={`Quantity ${index + 1}`} inputMode="decimal" value={line.quantity} onChange={(event) => updateLine(index, 'quantity', event.target.value)} className="field" placeholder="Qty" />
        <input aria-label={`Unit price ${index + 1}`} inputMode="decimal" value={line.unitPrice} onChange={(event) => updateLine(index, 'unitPrice', event.target.value)} className="field" placeholder="Price" />
        <button type="button" aria-label={`Remove line ${index + 1}`} className="text-gray-500 hover:text-red-600" disabled={lines.length === 1} onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))}><FiX /></button>
      </div>; })}
    </div>
    <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create draft'}</Button></div>
  </form>;
}

function PurchaseOrderDetail({ order, actionError, onAction, onReceive }: { order: PurchaseOrder; actionError: string | null; onAction: (order: PurchaseOrder, status: string) => Promise<void>; onReceive: () => void }) {
  const nextAction: Record<string, { label: string; status: string }> = { DRAFT: { label: 'Submit for approval', status: 'PENDING_APPROVAL' }, PENDING_APPROVAL: { label: 'Approve', status: 'APPROVED' }, APPROVED: { label: 'Send to supplier', status: 'SENT' } };
  const action = nextAction[order.status];
  return <div className="space-y-5">
    {actionError && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{actionError}</div>}
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-gray-500">Supplier</p><p className="font-semibold text-gray-900">{order.supplier.name}</p></div><Badge variant={(statusColors[order.status] as 'default' | 'warning' | 'info' | 'success' | 'danger') || 'default'}>{order.status.replaceAll('_', ' ')}</Badge></div>
    <div className="flex flex-wrap gap-2">{action && <Button size="sm" onClick={() => onAction(order, action.status)}>{action.label}</Button>}{order.status === 'SENT' || order.status === 'PARTIALLY_RECEIVED' ? <Button size="sm" variant="outline" onClick={onReceive}>Post goods receipt</Button> : null}{['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT'].includes(order.status) && <Button size="sm" variant="ghost" onClick={() => onAction(order, 'CANCELLED')}>Cancel</Button>}</div>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs uppercase text-gray-500"><th className="py-2">Item</th><th className="py-2">Ordered</th><th className="py-2">Accepted</th><th className="py-2">Remaining</th><th className="py-2">Price</th></tr></thead><tbody>{order.items.map((item) => <tr key={item.id} className="border-b"><td className="py-3">{item.product.name}{item.variant ? ` / ${item.variant.name}` : ''}</td><td className="py-3">{item.quantity} {item.product.unit}</td><td className="py-3">{item.receivedQty}</td><td className="py-3">{Math.max(0, Number(item.quantity) - Number(item.receivedQty))}</td><td className="py-3">${Number(item.unitPrice).toFixed(2)}</td></tr>)}</tbody></table></div>
    <div className="grid gap-2 text-sm sm:grid-cols-3"><div><span className="text-gray-500">Order date</span><p>{new Date(order.orderDate).toLocaleDateString()}</p></div><div><span className="text-gray-500">Expected date</span><p>{order.expectedDate ? new Date(order.expectedDate).toLocaleDateString() : 'Not set'}</p></div><div><span className="text-gray-500">Total</span><p className="font-semibold">${Number(order.totalAmount).toFixed(2)}</p></div></div>
    {order.notes && <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">{order.notes}</p>}
    <div><h3 className="mb-2 font-semibold text-gray-900">Receipt history</h3>{order.goodsReceipts.length === 0 ? <p className="text-sm text-gray-500">No receipts posted.</p> : <ul className="space-y-2 text-sm">{order.goodsReceipts.map((receipt) => <li key={receipt.id} className="rounded-lg border border-gray-200 p-3"><span className="font-medium">{receipt.receiptNumber}</span> · {new Date(receipt.receivedAt).toLocaleString()} · {receipt.lines.map((line) => `${line.acceptedQty} accepted / ${line.rejectedQty} rejected`).join(', ')}</li>)}</ul>}</div>
  </div>;
}

function GoodsReceiptForm({ order, warehouses, onCancel, onPosted }: { order: PurchaseOrder; warehouses: Warehouse[]; onCancel: () => void; onPosted: () => Promise<void> }) {
  const remaining = useMemo(() => order.items.map((item) => ({ item, remaining: Math.max(0, Number(item.quantity) - Number(item.receivedQty)) })), [order.items]);
  const [warehouseId, setWarehouseId] = useState('');
  const [reference, setReference] = useState('');
  const [idempotencyKey] = useState(() => `receipt-${order.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const [received, setReceived] = useState<Record<string, { receivedQty: string; acceptedQty: string; rejectedQty: string }>>(() => Object.fromEntries(remaining.map(({ item, remaining: qty }) => [item.id, { receivedQty: String(qty), acceptedQty: String(qty), rejectedQty: '0' }])));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(null);
    const items = order.items.map((item) => ({ itemId: item.id, ...(received[item.id] ?? { receivedQty: '0', acceptedQty: '0', rejectedQty: '0' }) })).filter((item) => Number(item.receivedQty) > 0);
    if (!warehouseId || items.length === 0) { setError('Warehouse and at least one received quantity are required.'); return; }
    if (items.some((item) => Number(item.acceptedQty) > Number(remaining.find(({ item: line }) => line.id === item.itemId)?.remaining ?? 0))) { setError('Accepted quantity cannot exceed the remaining ordered quantity.'); return; }
    if (items.some((item) => Number(item.acceptedQty) + Number(item.rejectedQty) !== Number(item.receivedQty))) { setError('Accepted plus rejected quantity must equal received quantity.'); return; }
    setSaving(true);
    try { await api.post(`/purchase-orders/${order.id}/receive`, { warehouseId, supplierDeliveryReference: reference || undefined, items }, { 'Idempotency-Key': idempotencyKey }); await onPosted(); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to post goods receipt.'); } finally { setSaving(false); }
  };
  return <form onSubmit={submit} className="space-y-4">{error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}<div className="grid gap-3 sm:grid-cols-2"><Field label="Warehouse *"><select aria-label="Warehouse" value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)} className="field"><option value="">Select warehouse</option>{warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name} ({warehouse.code})</option>)}</select></Field><Field label="Supplier delivery reference"><input aria-label="Supplier delivery reference" value={reference} onChange={(event) => setReference(event.target.value)} className="field" /></Field></div>{remaining.map(({ item, remaining: qty }) => { const values = received[item.id] ?? { receivedQty: '', acceptedQty: '', rejectedQty: '' }; return <div key={item.id} className="grid gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-[2fr_1fr_1fr_1fr]"><div className="text-sm"><p className="font-medium">{item.product.name}</p><p className="text-gray-500">Remaining {qty}</p></div><input aria-label={`Received ${item.id}`} inputMode="decimal" value={values.receivedQty} onChange={(event) => setReceived((current) => ({ ...current, [item.id]: { ...values, receivedQty: event.target.value } }))} className="field" placeholder="Received" /><input aria-label={`Accepted ${item.id}`} inputMode="decimal" value={values.acceptedQty} onChange={(event) => setReceived((current) => ({ ...current, [item.id]: { ...values, acceptedQty: event.target.value } }))} className="field" placeholder="Accepted" /><input aria-label={`Rejected ${item.id}`} inputMode="decimal" value={values.rejectedQty} onChange={(event) => setReceived((current) => ({ ...current, [item.id]: { ...values, rejectedQty: event.target.value } }))} className="field" placeholder="Rejected" /></div>; })}<div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Posting...' : 'Post receipt'}</Button></div></form>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-medium text-gray-700">{label}<span className="mt-1 block">{children}</span></label>; }
