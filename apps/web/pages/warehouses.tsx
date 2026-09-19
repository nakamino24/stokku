import { useState } from 'react';
import useSWR from 'swr';
import { FiPlus, FiArchive, FiMapPin, FiGrid, FiPackage } from 'react-icons/fi';
import { api } from '../utils/api';
import { Card, Button, Badge } from '@stokku/ui';

const fetcher = (url: string) => api.get<any[]>(url);

export default function WarehousesPage() {
  const { data, error, isLoading, mutate } = useSWR('/warehouses', fetcher);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '', address: '', city: '', country: '' });
  const [saving, setSaving] = useState(false);
  const [showZoneForm, setShowZoneForm] = useState<Record<string, boolean>>({});
  const [zoneForm, setZoneForm] = useState<Record<string, { name: string; code: string; description: string }>>({});
  const [zoneSaving, setZoneSaving] = useState<Record<string, boolean>>({});
  const [showBinForm, setShowBinForm] = useState<Record<string, boolean>>({});
  const [binForm, setBinForm] = useState<Record<string, { code: string; description: string; maxCapacity: string }>>({});
  const [binSaving, setBinSaving] = useState<Record<string, boolean>>({});

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/warehouses', form);
      setShowCreate(false);
      setForm({ name: '', code: '', description: '', address: '', city: '', country: '' });
      await mutate();
    } catch {} finally { setSaving(false); }
  };

  const handleCreateZone = async (warehouseId: string) => {
    const values = zoneForm[warehouseId] ?? { name: '', code: '', description: '' };
    if (!values.name || !values.code) return;

    setZoneSaving((current) => ({ ...current, [warehouseId]: true }));
    try {
      await api.post(`/warehouses/${warehouseId}/zones`, {
        name: values.name,
        code: values.code,
        description: values.description || undefined,
      });
      setShowZoneForm((current) => ({ ...current, [warehouseId]: false }));
      setZoneForm((current) => ({ ...current, [warehouseId]: { name: '', code: '', description: '' } }));
      await mutate();
    } finally {
      setZoneSaving((current) => ({ ...current, [warehouseId]: false }));
    }
  };

  const handleCreateBin = async (zoneId: string) => {
    const values = binForm[zoneId] ?? { code: '', description: '', maxCapacity: '' };
    if (!values.code) return;

    setBinSaving((current) => ({ ...current, [zoneId]: true }));
    try {
      await api.post(`/warehouses/zones/${zoneId}/bins`, {
        code: values.code,
        description: values.description || undefined,
        maxCapacity: values.maxCapacity ? Number(values.maxCapacity) : undefined,
      });
      setShowBinForm((current) => ({ ...current, [zoneId]: false }));
      setBinForm((current) => ({ ...current, [zoneId]: { code: '', description: '', maxCapacity: '' } }));
      await mutate();
    } finally {
      setBinSaving((current) => ({ ...current, [zoneId]: false }));
    }
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

                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <FiGrid size={14} />
                        Manage zones
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setShowZoneForm((current) => ({ ...current, [w.id]: !current[w.id] }))}>
                        Create zone
                      </Button>
                    </div>

                    {showZoneForm[w.id] && (
                      <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <input
                          type="text"
                          placeholder="Zone name"
                          value={zoneForm[w.id]?.name ?? ''}
                          onChange={(e) => setZoneForm((current) => ({ ...current, [w.id]: { ...(current[w.id] ?? { name: '', code: '', description: '' }), name: e.target.value } }))}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white outline-none focus:border-indigo-500"
                        />
                        <input
                          type="text"
                          placeholder="Zone code"
                          value={zoneForm[w.id]?.code ?? ''}
                          onChange={(e) => setZoneForm((current) => ({ ...current, [w.id]: { ...(current[w.id] ?? { name: '', code: '', description: '' }), code: e.target.value } }))}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white outline-none focus:border-indigo-500"
                        />
                        <textarea
                          rows={2}
                          placeholder="Zone description"
                          value={zoneForm[w.id]?.description ?? ''}
                          onChange={(e) => setZoneForm((current) => ({ ...current, [w.id]: { ...(current[w.id] ?? { name: '', code: '', description: '' }), description: e.target.value } }))}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white outline-none focus:border-indigo-500"
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setShowZoneForm((current) => ({ ...current, [w.id]: false }))} disabled={zoneSaving[w.id]}>
                            Cancel
                          </Button>
                          <Button variant="primary" size="sm" onClick={() => handleCreateZone(w.id)} disabled={zoneSaving[w.id]}>
                            {zoneSaving[w.id] ? 'Saving...' : 'Save zone'}
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 space-y-2">
                      {(w.zones ?? []).length > 0 ? (
                        w.zones.map((zone: any) => (
                          <div key={zone.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                  <FiPackage size={12} /> {zone.name}
                                  <Badge variant="default" size="sm">{zone.code}</Badge>
                                </div>
                                {zone.description && <div className="mt-1 text-xs text-gray-500">{zone.description}</div>}
                              </div>
                              <Button variant="outline" size="sm" onClick={() => setShowBinForm((current) => ({ ...current, [zone.id]: !current[zone.id] }))}>
                                Add bin
                              </Button>
                            </div>

                            {showBinForm[zone.id] && (
                              <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                                <input
                                  type="text"
                                  placeholder="Bin code"
                                  value={binForm[zone.id]?.code ?? ''}
                                  onChange={(e) => setBinForm((current) => ({ ...current, [zone.id]: { ...(current[zone.id] ?? { code: '', description: '', maxCapacity: '' }), code: e.target.value } }))}
                                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-indigo-500"
                                />
                                <input
                                  type="text"
                                  placeholder="Max capacity"
                                  value={binForm[zone.id]?.maxCapacity ?? ''}
                                  onChange={(e) => setBinForm((current) => ({ ...current, [zone.id]: { ...(current[zone.id] ?? { code: '', description: '', maxCapacity: '' }), maxCapacity: e.target.value } }))}
                                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-indigo-500"
                                />
                                <textarea
                                  rows={2}
                                  placeholder="Bin description"
                                  value={binForm[zone.id]?.description ?? ''}
                                  onChange={(e) => setBinForm((current) => ({ ...current, [zone.id]: { ...(current[zone.id] ?? { code: '', description: '', maxCapacity: '' }), description: e.target.value } }))}
                                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-indigo-500"
                                />
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => setShowBinForm((current) => ({ ...current, [zone.id]: false }))} disabled={binSaving[zone.id]}>
                                    Cancel
                                  </Button>
                                  <Button variant="primary" size="sm" onClick={() => handleCreateBin(zone.id)} disabled={binSaving[zone.id]}>
                                    {binSaving[zone.id] ? 'Saving...' : 'Save bin'}
                                  </Button>
                                </div>
                              </div>
                            )}

                            <div className="mt-3 flex flex-wrap gap-2">
                              {(zone.bins ?? []).length > 0 ? (
                                zone.bins.map((bin: any) => (
                                  <Badge key={bin.id} variant="default" size="sm">{bin.code}</Badge>
                                ))
                              ) : (
                                <span className="text-xs text-gray-500">No bins yet</span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-200 p-3 text-xs text-gray-500">No zones yet. Create a zone to start organizing storage.</div>
                      )}
                    </div>
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
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                  <input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
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
