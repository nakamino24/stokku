import { useState } from 'react';
import useSWR from 'swr';
import { FiPlus, FiUsers, FiSearch } from 'react-icons/fi';
import { api } from '../utils/api';
import { Card, Button, Spinner } from '@stokku/ui';

const fetcher = (url: string) => api.get<any>(url);

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '' });
  const [saving, setSaving] = useState(false);

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (search) params.set('search', search);

  const { data, error, isLoading, mutate } = useSWR(`/customers?${params}`, fetcher);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/customers', form);
      setShowCreate(false);
      setForm({ name: '', email: '', phone: '', address: '', city: '' });
      mutate();
    } catch {} finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your customer database</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <FiPlus size={16} /> New Customer
        </Button>
      </div>

      <div className="relative mb-4">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input type="text" placeholder="Search by name, email, or phone..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 outline-none" />
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">Failed to load customers</div>}

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}</div>
      ) : data?.data?.length > 0 ? (
        <div className="space-y-2">
          {data.data.map((c: any) => (
            <Card key={c.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-500">
                  <FiUsers size={20} />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.email || c.phone || 'No contact info'}</div>
                </div>
              </div>
              <div className="text-xs text-gray-400">{c._count?.salesOrders || 0} orders</div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <FiUsers size={48} className="mx-auto mb-4" />
          <p className="text-lg">No customers yet</p>
          <p className="text-sm mt-2">Add customers to create sales orders.</p>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">New Customer</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setShowCreate(false)} disabled={saving}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Create'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
