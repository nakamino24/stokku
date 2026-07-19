import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { FiPlus, FiSearch, FiPackage, FiDollarSign, FiGrid } from 'react-icons/fi';
import { Button } from '@stokku/ui';

const fetcher = (url: string) => {
  const token = localStorage.getItem('token');
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(async (res) => {
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to fetch');
    }
    return res.json();
  });
};

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const query = new URLSearchParams({ page: String(page), limit: '20' });
  if (search) query.set('search', search);

  const { data, error, isLoading, mutate } = useSWR(
    `${API}/inventory/products?${query}`,
    fetcher
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product and all its variants?')) return;
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API}/inventory/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      mutate();
    } catch {
      alert('Failed to delete product');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Products</h1>
        <Link href="/products/create">
          <Button variant="primary">
            <FiPlus size={16} /> New Product
          </Button>
        </Link>
      </div>

      <div style={{ marginBottom: '16px', position: 'relative' }}>
        <FiSearch
          size={16}
          style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
        />
        <input
          type="text"
          placeholder="Search products by name or SKU..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{
            width: '100%',
            padding: '10px 12px 10px 40px',
            fontSize: '0.875rem',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {error && (
        <div style={{ padding: '16px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '8px', marginBottom: '16px' }}>
          Failed to load products
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'grid', gap: '12px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: '80px', backgroundColor: '#f3f4f6', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
          ))}
          <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
        </div>
      ) : data?.products?.length > 0 ? (
        <>
          <div style={{ display: 'grid', gap: '12px' }}>
            {data.products.map((product: any) => (
              <div
                key={product.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: '#eef2ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#6366f1',
                    }}
                  >
                    <FiPackage size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#111827' }}>{product.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' }}>
                      {product.variants?.length || 0} variant{(product.variants?.length || 0) !== 1 ? 's' : ''}
                      {product.category && <> &middot; {product.category.name}</>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    <FiDollarSign size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
                    {product.variants?.[0]?.price != null
                      ? `$${Number(product.variants[0].price).toFixed(2)}`
                      : '—'}
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: product.status === 'active' ? '#f0fdf4' : '#f3f4f6',
                      color: product.status === 'active' ? '#15803d' : '#6b7280',
                    }}
                  >
                    {product.status}
                  </span>
                  <button
                    onClick={() => handleDelete(product.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc2626',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      padding: '4px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          {data.pagination && data.pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
              {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${p === page ? '#6366f1' : '#e5e7eb'}`,
                    backgroundColor: p === page ? '#6366f1' : '#ffffff',
                    color: p === page ? '#ffffff' : '#374151',
                    cursor: 'pointer',
                    fontWeight: p === page ? 600 : 400,
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
          <FiGrid size={48} style={{ margin: '0 auto 16px', display: 'block' }} />
          <p style={{ margin: 0, fontSize: '1.125rem' }}>No products yet</p>
          <p style={{ margin: '8px 0 0', fontSize: '0.875rem' }}>Create your first product to start tracking inventory.</p>
        </div>
      )}
    </div>
  );
}
