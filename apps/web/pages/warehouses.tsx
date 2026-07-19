import useSWR from 'swr';
import Link from 'next/link';
import MainLayout from '../components/layout/MainLayout';
import { Card, Badge, Spinner, Button } from '@stokku/ui';
import { FiPlus, FiMapPin, FiPackage, FiArchive, FiTrendingUp, FiChevronRight } from 'react-icons/fi';
import axios from 'axios';

const fetcher = (url: string) => axios.get(url, {
  headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token')}` },
}).then(r => r.data.warehouses);

export default function WarehousesPage() {
  const { data: warehouses, error, isLoading } = useSWR('/api/inventory/warehouses', fetcher);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
            <p className="text-gray-500 mt-1">Manage storage locations and stock levels</p>
          </div>
          <Button className="flex items-center gap-2 px-4 py-2">
            <FiPlus className="w-4 h-4" />
            New Warehouse
          </Button>
        </div>

        {isLoading && <div className="flex justify-center py-12"><Spinner /></div>}
        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">Failed to load warehouses</div>}

        {warehouses?.length === 0 ? (
          <Card className="p-12 text-center">
            <FiArchive className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No warehouses yet</h3>
            <p className="text-gray-400 text-sm mb-4">Create your first warehouse to start tracking inventory</p>
            <Button className="px-4 py-2">Create Warehouse</Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {warehouses?.map((w: any) => (
              <Link key={w.id} href={`/warehouses/${w.id}`}>
                <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <FiArchive className="w-4 h-4 text-gray-400" />
                        <h3 className="font-semibold text-gray-900">{w.name}</h3>
                      </div>
                      <span className="text-xs text-gray-400 font-mono">{w.code}</span>
                    </div>
                    <Badge variant={w.isActive ? 'success' : 'default'}>
                      {w.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {w.description && <p className="text-sm text-gray-500 mb-3">{w.description}</p>}
                  {w.address && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                      <FiMapPin className="w-3 h-3" />
                      <span>{w.address}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <FiPackage className="w-3.5 h-3.5" />
                        <span>{w._count?.stockLevels ?? 0} SKUs</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <FiTrendingUp className="w-3.5 h-3.5" />
                        <span>{w._count?.movements ?? 0} movements</span>
                      </div>
                    </div>
                    <FiChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
