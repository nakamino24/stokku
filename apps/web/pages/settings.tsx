import { useState, useEffect } from 'react';
import { FiSave, FiSettings } from 'react-icons/fi';
import { api } from '../utils/api';
import { Card, Button, Spinner } from '@stokku/ui';

export default function SettingsPage() {
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<any>('/settings/organization')
      .then(setOrg)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings/organization', org);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {} finally { setSaving(false); }
  };

  if (loading) return <div className="py-12 text-center"><Spinner /></div>;

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Organization preferences</p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
              <input value={org?.name || ''} onChange={e => setOrg({...org, name: e.target.value})}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input value={org?.slug || ''} disabled
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-500 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={org?.email || ''} onChange={e => setOrg({...org, email: e.target.value})}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={org?.phone || ''} onChange={e => setOrg({...org, phone: e.target.value})}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input value={org?.address || ''} onChange={e => setOrg({...org, address: e.target.value})}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input value={org?.city || ''} onChange={e => setOrg({...org, city: e.target.value})}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input value={org?.country || ''} onChange={e => setOrg({...org, country: e.target.value})}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select value={org?.currency || 'USD'} onChange={e => setOrg({...org, currency: e.target.value})}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 outline-none bg-white">
                <option value="USD">USD ($)</option><option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option><option value="JPY">JPY (¥)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select value={org?.timezone || 'UTC'} onChange={e => setOrg({...org, timezone: e.target.value})}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 outline-none bg-white">
                <option value="UTC">UTC</option><option value="US/Eastern">US Eastern</option>
                <option value="US/Central">US Central</option><option value="US/Mountain">US Mountain</option>
                <option value="US/Pacific">US Pacific</option><option value="Europe/London">Europe/London</option>
                <option value="Europe/Berlin">Europe/Berlin</option><option value="Asia/Tokyo">Asia/Tokyo</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-4">
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? <><Spinner size="sm" /> Saving...</> : <><FiSave size={16} /> Save Changes</>}
            </Button>
            {saved && <span className="text-sm text-green-600">Settings saved successfully</span>}
          </div>
        </div>
      </Card>
    </div>
  );
}
