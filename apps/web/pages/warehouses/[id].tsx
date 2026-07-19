import { useRouter } from 'next/router';
import useSWR from 'swr';
import Link from 'next/link';
import MainLayout from '../../components/layout/MainLayout';
import { Card, Badge, Spinner, Button } from '@stokku/ui';
import { FiArrowLeft, FiMapPin, FiPackage, FiTrendingUp } from 'react-icons/fi';
import axios from 'axios';

const token = () => localStorage.getItem('accessToken') || localStorage.getItem('token');
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function WarehouseDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const { data: warehouse, error: whErr } = useSWR(
    id ? `/api/inventory/warehouses/${id}` : null,
    (url: string) => axios.get(url, { headers: headers() }).then(r => r.data),
  );

  const { data: stockData, error: stockErr } = useSWR(
    id ? `/api/inventory/stock/levels?warehouseId=${id}` : null,
    (url: string) => axios.get(url, { headers: headers() }).then(r => r.data.levels),
  );

  const { data: movData } = useSWR(
    id ? `/api/inventory/stock/movements?warehouseId=${id}&limit=10` : null,
    (url: string) => axios.get(url, { headers: headers() }).then(r => r.data.movements),
  );

  if (whErr) return <MainLayout><div className="p-8 text-red-500">Warehouse not found</div></MainLayout>;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <Link href="/warehouses" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <FiArrowLeft className="w-4 h-4" /> Back to Warehouses
        </Link>

        {!warehouse ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{warehouse.name}</h1>
                  <Badge variant={warehouse.isActive ? 'success' : 'default'}>
                    {warehouse.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <span className="text-sm text-gray-400 font-mono">{warehouse.code}</span>
                {warehouse.description && <p className="text-gray-500 mt-2">{warehouse.description}</p>}
                {warehouse.address && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-400 mt-1">
                    <FiMapPin className="w-3.5 h-3.5" />
                    <span>{warehouse.address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiPackage className="w-4 h-4" /> Stock Levels
                </h2>
                {stockErr && <p className="text-red-500 text-sm">Failed to load stock</p>}
                {!stockData ? (
                  <div className="flex justify-center py-8"><Spinner /></div>
                ) : stockData.length === 0 ? (
                  <p className="text-gray-400 text-sm py-8 text-center">No stock in this warehouse</p>
                ) : (
                  <div className="space-y-2">
                    {stockData.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{s.variant?.name || s.variantId}</p>
                          <p className="text-xs text-gray-400">{s.variant?.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${s.onHand <= (s.reorderPoint || 0) ? 'text-red-600' : 'text-gray-900'}`}>
                            {s.onHand} {s.variant?.uom || 'units'}
                          </p>
                          {s.reorderPoint != null && (
                            <p className="text-xs text-gray-400">Reorder at {s.reorderPoint}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiTrendingUp className="w-4 h-4" /> Recent Movements
                </h2>
                {!movData ? (
                  <div className="flex justify-center py-8"><Spinner /></div>
                ) : movData.length === 0 ? (
                  <p className="text-gray-400 text-sm py-8 text-center">No recent movements</p>
                ) : (
                  <div className="space-y-2">
                    {movData.map((m: any) => (
                      <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{m.variant?.name || m.variantId}</p>
                          <p className="text-xs text-gray-400">
                            {m.type} · {m.reference || '—'} · {new Date(m.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`ml-3 text-sm font-semibold ${m.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {m.quantity > 0 ? '+' : ''}{m.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
