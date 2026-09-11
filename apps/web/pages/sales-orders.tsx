import { useState } from 'react';
import useSWR from 'swr';
import { FiPlus, FiFileText, FiX } from 'react-icons/fi';
import { api } from '../utils/api';
import { Card, Button, Spinner, Badge, Modal } from '@stokku/ui';
import { Pagination } from '../components/Pagination';

interface Customer { id: string; name: string; isActive: boolean }
interface ProductVariant { id: string; name: string; sku?: string | null; unitPrice: string | number }
interface Product { id: string; name: string; sku?: string | null; unit: string; unitPrice: string | number; variants: ProductVariant[] }
interface Allocation { id: string; quantity: string; status: string; stockLevel: { warehouse: { name: string; code: string }; bin?: { code: string } | null } }
interface SalesOrderItem { id: string; quantity: string; unitPrice: string; product: { name: string; sku?: string | null; unit: string }; variant?: { name: string; sku?: string | null } | null; allocations: Allocation[] }
interface SalesOrder { id: string; soNumber: string; status: string; orderDate: string; totalAmount: string; subtotal: string; taxAmount: string; notes?: string | null; customer: { id: string; name: string }; items: SalesOrderItem[]; _count?: { items: number }; confirmedAt?: string | null; allocatedAt?: string | null; pickedAt?: string | null; packedAt?: string | null; shippedAt?: string | null; deliveredAt?: string | null; closedAt?: string | null }
interface Paginated<T> { data: T[]; pagination: { page: number; totalPages: number; hasNext: boolean; hasPrev: boolean } }
const fetcher = <T,>(url: string) => api.get<T>(url);

const statusColors: Record<string, string> = {
  DRAFT: 'default', CONFIRMED: 'info', ALLOCATED: 'info', PICKING: 'warning',
  PICKED: 'warning', PACKED: 'warning', SHIPPED: 'info', DELIVERED: 'success',
  CLOSED: 'success', CANCELLED: 'danger', RETURNED: 'default',
};

export default function SalesOrdersPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (statusFilter) params.set('status', statusFilter);

  const { data, error, isLoading, mutate } = useSWR<Paginated<SalesOrder>>(`/sales-orders?${params}`, fetcher);
  const { data: customers } = useSWR<Paginated<Customer>>('/customers?limit=100', fetcher);
  const { data: products } = useSWR<Paginated<Product>>('/products?limit=100', fetcher);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SalesOrder | null>(null);
  const openDetail = async (id: string) => { setActionError(null); try { setSelected(await api.get<SalesOrder>(`/sales-orders/${id}`)); setSelectedId(id); } catch (err) { setActionError(err instanceof Error ? err.message : 'Unable to load sales order.'); } };
  const refreshSelected = async (id: string) => { const detail = await api.get<SalesOrder>(`/sales-orders/${id}`); await mutate((current) => current ? { ...current, data: current.data.map((order) => order.id === id ? { ...order, ...detail, _count: { items: detail.items.length } } : order) } : current, { revalidate: true }); setSelectedId(id); setSelected(detail); };
  const transition = async (order: SalesOrder, status: string) => { setActionError(null); try { await api.patch(`/sales-orders/${order.id}/status`, { status }); await refreshSelected(order.id); setFeedback(`Sales order ${status.toLowerCase()}.`); } catch (err) { setActionError(err instanceof Error ? err.message : 'Unable to update sales order.'); } };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Manage customer orders and fulfillment</p>
        </div>
        <Button variant="primary" onClick={() => { setActionError(null); setShowCreate(true); }}><FiPlus size={16} /> New Sales Order</Button>
      </div>

      <div className="mb-4 flex gap-2 flex-wrap">
        {['', 'DRAFT', 'CONFIRMED', 'ALLOCATED', 'PICKING', 'PICKED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CLOSED', 'CANCELLED', 'RETURNED'].map(s => (
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
      ) : data?.data && data.data.length > 0 ? (
        <div className="space-y-2">
          {data.data.map((so) => (
            <Card key={so.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => void openDetail(so.id)}>
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
                    <div className="text-xs text-gray-400">{so._count?.items || 0} items</div>
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
      {data?.pagination && <Pagination page={page} totalPages={data.pagination.totalPages} onPageChange={setPage} label="Sales order pages" />}
      {feedback && <div role="status" className="fixed bottom-5 right-5 z-40 rounded-lg bg-emerald-600 px-4 py-3 text-sm text-white shadow-lg">{feedback}<button aria-label="Dismiss" className="ml-3" onClick={() => setFeedback(null)}><FiX className="inline" /></button></div>}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Sales Order" size="xl"><SalesOrderForm customers={customers?.data ?? []} products={products?.data ?? []} onCancel={() => setShowCreate(false)} onCreated={async (order) => { setShowCreate(false); await mutate(); await openDetail(order.id); setFeedback('Sales order created as draft.'); }} /></Modal>
      <Modal open={!!selected} onClose={() => { setSelectedId(null); setSelected(null); }} title={selected ? selected.soNumber : 'Sales Order'} size="xl">{selected && <SalesOrderDetail order={selected} actionError={actionError} onAction={transition} />}</Modal>
    </div>
  );
}

function SalesOrderForm({ customers, products, onCancel, onCreated }: { customers: Customer[]; products: Product[]; onCancel: () => void; onCreated: (order: SalesOrder) => Promise<void> }) {
  const [customerId, setCustomerId] = useState(''); const [notes, setNotes] = useState(''); const [taxRate, setTaxRate] = useState('0'); const [lines, setLines] = useState([{ productId: '', variantId: '', quantity: '1', unitPrice: '' }]); const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null);
  const updateLine = (index: number, field: 'productId' | 'variantId' | 'quantity' | 'unitPrice', value: string) => setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, [field]: value, ...(field === 'productId' ? { variantId: '' } : {}) } : line));
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (!customerId || lines.some((line) => !line.productId || !line.quantity || !line.unitPrice)) { setError('Customer, product, quantity, and unit price are required.'); return; } setSaving(true); setError(null); try { const order = await api.post<SalesOrder>('/sales-orders', { customerId, notes: notes || undefined, taxRate: taxRate || '0', items: lines.map((line) => ({ productId: line.productId, variantId: line.variantId || null, quantity: line.quantity, unitPrice: line.unitPrice })) }); await onCreated(order); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to create sales order.'); } finally { setSaving(false); } };
  return <form onSubmit={submit} className="space-y-4">{error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}<Field label="Customer *"><select aria-label="Customer" value={customerId} onChange={(event) => setCustomerId(event.target.value)} className="field"><option value="">Select customer</option>{customers.filter((customer) => customer.isActive).map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></Field><Field label="Tax rate"><input aria-label="Tax rate" inputMode="decimal" value={taxRate} onChange={(event) => setTaxRate(event.target.value)} className="field" /></Field><Field label="Notes"><textarea aria-label="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} className="field" rows={2} /></Field><div className="space-y-3"><div className="flex items-center justify-between"><h3 className="font-semibold text-gray-900">Line items</h3><Button type="button" size="sm" variant="outline" onClick={() => setLines((current) => [...current, { productId: '', variantId: '', quantity: '1', unitPrice: '' }])}>Add line</Button></div>{lines.map((line, index) => { const product = products.find((candidate) => candidate.id === line.productId); return <div key={index} className="grid gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-[2fr_1.5fr_1fr_1fr_auto]"><select aria-label={`Product ${index + 1}`} value={line.productId} onChange={(event) => { updateLine(index, 'productId', event.target.value); const next = products.find((candidate) => candidate.id === event.target.value); if (next) updateLine(index, 'unitPrice', String(next.unitPrice)); }} className="field"><option value="">Select product</option>{products.map((item) => <option key={item.id} value={item.id}>{item.name}{item.sku ? ` (${item.sku})` : ''}</option>)}</select><select aria-label={`Variant ${index + 1}`} value={line.variantId} onChange={(event) => { updateLine(index, 'variantId', event.target.value); const variant = product?.variants.find((candidate) => candidate.id === event.target.value); if (variant) updateLine(index, 'unitPrice', String(variant.unitPrice)); }} className="field" disabled={!product || product.variants.length === 0}><option value="">No variant</option>{product?.variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.name}</option>)}</select><input aria-label={`Quantity ${index + 1}`} inputMode="decimal" value={line.quantity} onChange={(event) => updateLine(index, 'quantity', event.target.value)} className="field" placeholder="Qty" /><input aria-label={`Unit price ${index + 1}`} inputMode="decimal" value={line.unitPrice} onChange={(event) => updateLine(index, 'unitPrice', event.target.value)} className="field" placeholder="Price" /><button type="button" aria-label={`Remove line ${index + 1}`} className="text-gray-500 hover:text-red-600" disabled={lines.length === 1} onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))}><FiX /></button></div>; })}</div><div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create draft'}</Button></div></form>;
}

function SalesOrderDetail({ order, actionError, onAction }: { order: SalesOrder; actionError: string | null; onAction: (order: SalesOrder, status: string) => Promise<void> }) {
  const nextActions: Record<string, Array<{ label: string; status: string }>> = { DRAFT: [{ label: 'Confirm', status: 'CONFIRMED' }], CONFIRMED: [{ label: 'Allocate stock', status: 'ALLOCATED' }], ALLOCATED: [{ label: 'Start picking', status: 'PICKING' }], PICKING: [{ label: 'Mark picked', status: 'PICKED' }], PICKED: [{ label: 'Pack order', status: 'PACKED' }], PACKED: [{ label: 'Ship order', status: 'SHIPPED' }], SHIPPED: [{ label: 'Mark delivered', status: 'DELIVERED' }], DELIVERED: [{ label: 'Close order', status: 'CLOSED' }, { label: 'Mark returned', status: 'RETURNED' }] }; const actions = nextActions[order.status] ?? [];
  const timestamp = (value?: string | null) => value ? new Date(value).toLocaleString() : 'Not recorded';
  return <div className="space-y-5">{actionError && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{actionError}</div>}<div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-gray-500">Customer</p><p className="font-semibold text-gray-900">{order.customer.name}</p></div><Badge variant={(statusColors[order.status] as 'default' | 'warning' | 'info' | 'success' | 'danger') || 'default'}>{order.status}</Badge></div><div className="flex flex-wrap gap-2">{actions.map(action => <Button key={action.status} size="sm" onClick={() => onAction(order, action.status)}>{action.label}</Button>)}{['DRAFT', 'CONFIRMED', 'ALLOCATED', 'PICKING'].includes(order.status) && <Button size="sm" variant="ghost" onClick={() => onAction(order, 'CANCELLED')}>Cancel</Button>}</div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs uppercase text-gray-500"><th className="py-2">Item</th><th className="py-2">Quantity</th><th className="py-2">Allocation</th><th className="py-2">Price</th></tr></thead><tbody>{order.items.map((item) => <tr key={item.id} className="border-b"><td className="py-3">{item.product.name}{item.variant ? ` / ${item.variant.name}` : ''}</td><td className="py-3">{item.quantity} {item.product.unit}</td><td className="py-3">{item.allocations.length ? item.allocations.map((allocation) => `${allocation.quantity} @ ${allocation.stockLevel.warehouse.code}${allocation.stockLevel.bin ? `/${allocation.stockLevel.bin.code}` : ''} (${allocation.status})`).join(', ') : 'Not allocated'}</td><td className="py-3">${Number(item.unitPrice).toFixed(2)}</td></tr>)}</tbody></table></div><div className="grid gap-2 text-sm sm:grid-cols-4"><div><span className="text-gray-500">Confirmed</span><p>{timestamp(order.confirmedAt)}</p></div><div><span className="text-gray-500">Allocated</span><p>{timestamp(order.allocatedAt)}</p></div><div><span className="text-gray-500">Shipped</span><p>{timestamp(order.shippedAt)}</p></div><div><span className="text-gray-500">Total</span><p className="font-semibold">${Number(order.totalAmount).toFixed(2)}</p></div></div>{order.notes && <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">{order.notes}</p>}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-medium text-gray-700">{label}<span className="mt-1 block">{children}</span></label>; }
