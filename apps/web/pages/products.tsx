import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { FiPlus, FiSearch, FiPackage, FiDollarSign } from 'react-icons/fi';
import { api } from '../utils/api';
import { Card, Spinner, Badge, Button } from '@stokku/ui';
import { ConfirmDialog } from '../components/ConfirmDialog';
import CreateProductModal from '../components/products/CreateProductModal';

const fetcher = (url: string) => api.get<any>(url);

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (search) params.set('search', search);

  const { data, error, isLoading, mutate } = useSWR(`/products?${params}`, fetcher);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/products/${deleteTarget}`);
      mutate();
    } catch {
      setDeleteTarget(null);
    }
    setDeleteTarget(null);
  };

  const handleCancelDelete = useCallback(() => setDeleteTarget(null), []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your product catalog</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <FiPlus size={16} /> New Product
        </Button>
      </div>

      <div className="relative mb-4">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
        />
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">Failed to load products: {error.message}</div>}

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      ) : data?.data?.length > 0 ? (
        <>
          <div className="space-y-2">
            {data.data.map((product: any) => (
              <Card key={product.id} className="p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                    <FiPackage size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{product.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {product.sku && <>SKU: {product.sku} &middot; </>}
                      {product.variants?.length || 0} variant{(product.variants?.length || 0) !== 1 ? 's' : ''}
                      {product.category && <> &middot; {product.category.name}</>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    <FiDollarSign size={14} className="inline align-middle" />
                    {Number(product.unitPrice).toFixed(2)}
                  </div>
                  <Badge variant={product.status === 'ACTIVE' ? 'success' : 'default'}>{product.status}</Badge>
                  <button onClick={() => setDeleteTarget(product.id)} className="text-xs text-red-600 hover:text-red-700 font-medium">Deactivate</button>
                </div>
              </Card>
            ))}
          </div>
          {data.pagination?.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-all ${
                    p === page ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}>{p}</button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <FiPackage size={48} className="mx-auto mb-4" />
          <p className="text-lg">No products yet</p>
          <p className="text-sm mt-2">Create your first product to start tracking inventory.</p>
        </div>
      )}

      {showCreate && <CreateProductModal onClose={() => { setShowCreate(false); mutate(); }} />}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Deactivate product"
        message="Are you sure you want to deactivate this product? It will no longer be available for new transactions."
        confirmLabel="Deactivate"
        onConfirm={handleDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
