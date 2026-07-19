import { useState } from 'react';
import useSWR from 'swr';
import { FiPlus, FiArchive, FiMapPin } from 'react-icons/fi';
import { api } from '../utils/api';
import { Card, Button, Spinner, Badge } from '@stokku/ui';

const fetcher = (url: string) => api.get<any[]>(url);

export default function WarehousesPage() {
  const { data, error, isLoading, mutate } = useSWR('/warehouses', fetcher);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '', address: '', city: '', country: '' });
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/warehouses', form);
      setShowCreate(false);
      setForm({ name: '', code: '', description: '', address: '', city: '', country: '' });
      mutate();
    } catch {} finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
          <p className="text-gray-500 text-sm mt-1">Manage storage locations</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <FiPlus size={16} /> New Warehouse
        </Button>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">Failed to load warehouses</div>}

      {isLoading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : data && data.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((w: any) => (
            <Card key={w.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-violet-50 text-violet-500">
                  <FiArchive size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{w.name}</h3>
                    <Badge variant="default" size="sm">{w.code}</Badge>
                  </div>
                  {w.address && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                      <FiMapPin size={13} /> {w.address}{w.city ? `, ${w.city}` : ''}
                    </div>
                  )}
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    <span>{w.zones?.length || 0} zones</span>
                    <span>{w._count?.stockLevels || 0} stock items</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <FiArchive size={48} className="mx-auto mb-4" />
          <p className="text-lg">No warehouses yet</p>
          <p className="text-sm mt-2">Create warehouses to track inventory by location.</p>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">New Warehouse</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                  <input required value={form.code} onChange={e => setForm({...form, code: e.target.value})}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setShowCreate(false)} disabled={saving}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
