import { useState, useEffect } from 'react';
import { FiPackage, FiTruck, FiArchive, FiUsers, FiAlertTriangle, FiShoppingCart, FiFileText } from 'react-icons/fi';
import Link from 'next/link';
import { api } from '../utils/api';
import { Card, Spinner } from '@stokku/ui';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<any>('/dashboard/summary')
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>;

  const stats = data?.stats;

  const statCards = [
    { label: 'Products', value: stats?.products ?? 0, icon: FiPackage, color: 'indigo', href: '/products' },
    { label: 'Suppliers', value: stats?.suppliers ?? 0, icon: FiTruck, color: 'blue', href: '/suppliers' },
    { label: 'Customers', value: stats?.customers ?? 0, icon: FiUsers, color: 'green', href: '/customers' },
    { label: 'Warehouses', value: stats?.warehouses ?? 0, icon: FiArchive, color: 'violet', href: '/warehouses' },
    { label: 'Pending POs', value: stats?.pendingPO ?? 0, icon: FiShoppingCart, color: 'orange', href: '/purchase-orders' },
    { label: 'Pending SOs', value: stats?.pendingSO ?? 0, icon: FiFileText, color: 'cyan', href: '/sales-orders' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your inventory operations</p>
      </div>

      {stats?.lowStockAlerts > 0 && (
        <Link href="/stock?filter=low-stock" className="flex items-center gap-2.5 p-3.5 mb-6 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm hover:bg-amber-100 transition-colors">
          <FiAlertTriangle className="w-4 h-4 shrink-0" />
          <span className="font-medium">{stats.lowStockAlerts} product{stats.lowStockAlerts > 1 ? 's' : ''} below reorder point</span>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          const colorMap: Record<string, string> = {
            indigo: 'text-indigo-500 bg-indigo-50', blue: 'text-blue-500 bg-blue-50',
            green: 'text-green-500 bg-green-50', violet: 'text-violet-500 bg-violet-50',
            orange: 'text-orange-500 bg-orange-50', cyan: 'text-cyan-500 bg-cyan-50',
          };
          return (
            <Link key={card.label} href={card.href}>
              <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-lg ${colorMap[card.color] || 'text-gray-500 bg-gray-50'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{card.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent Activity</h2>
        <Card className="divide-y divide-gray-100">
          {data?.recentMovements?.length > 0 ? data.recentMovements.slice(0, 10).map((m: any) => (
            <div key={m.id} className="flex items-center gap-3 p-3 text-sm">
              <div className={`w-2 h-2 rounded-full ${
                m.type === 'IN' ? 'bg-green-500' :
                m.type === 'OUT' ? 'bg-red-500' :
                m.type === 'TRANSFER' ? 'bg-blue-500' : 'bg-amber-500'
              }`} />
              <span className="text-gray-700">{m.product?.name}</span>
              <span className={`font-medium ${
                m.quantity > 0 ? 'text-green-600' : 'text-red-600'
              }`}>{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</span>
              <span className="text-gray-400 text-xs">{m.warehouse?.name}</span>
              <span className="text-gray-400 text-xs ml-auto">{new Date(m.createdAt).toLocaleDateString()}</span>
            </div>
          )) : (
            <div className="p-6 text-center text-gray-400 text-sm">No recent activity</div>
          )}
        </Card>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Link href="/products" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">View Products</Link>
        <Link href="/stock" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">View Stock</Link>
        <Link href="/purchase-orders" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Purchase Orders</Link>
        <Link href="/sales-orders" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Sales Orders</Link>
      </div>
    </div>
  );
}
