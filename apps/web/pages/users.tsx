import { useState } from 'react';
import useSWR from 'swr';
import { FiUsers, FiSearch, FiShield } from 'react-icons/fi';
import { api } from '../utils/api';
import { Card, Spinner, Badge } from '@stokku/ui';

const fetcher = (url: string) => api.get<any>(url);

const roleColors: Record<string, string> = {
  OWNER: 'danger', ADMIN: 'warning', INVENTORY_MANAGER: 'info',
  WAREHOUSE_STAFF: 'default', CASHIER: 'default', VIEWER: 'default',
};

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const params = new URLSearchParams({ limit: '50' });
  if (search) params.set('search', search);

  const { data, error, isLoading } = useSWR(`/users?${params}`, fetcher);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm mt-1">Manage team members and their roles</p>
        </div>
      </div>

      <div className="relative mb-4">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input type="text" placeholder="Search users..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 outline-none" />
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">Failed to load users</div>}

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}</div>
      ) : data?.data?.length > 0 ? (
        <div className="space-y-2">
          {data.data.map((u: any) => (
            <Card key={u.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-semibold">
                  {u.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{u.name}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <FiShield size={13} />
                  <Badge variant={(roleColors[u.role] as any) || 'default'} size="sm">{u.role.replace('_', ' ')}</Badge>
                </div>
                {u.lastLoginAt && (
                  <span className="text-xs text-gray-400">Last login: {new Date(u.lastLoginAt).toLocaleDateString()}</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <FiUsers size={48} className="mx-auto mb-4" />
          <p className="text-lg">No users found</p>
        </div>
      )}
    </div>
  );
}
