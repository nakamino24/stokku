import { useState } from 'react';
import useSWR from 'swr';
import { FiPlus, FiFolder, FiChevronRight, FiChevronDown } from 'react-icons/fi';
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

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  sortOrder: number;
  children: CategoryNode[];
}

function CategoryRow({ node, depth = 0 }: { node: CategoryNode; depth?: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          paddingLeft: `${16 + depth * 24}px`,
          borderBottom: '1px solid #f3f4f6',
          cursor: 'pointer',
        }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          expanded ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />
        ) : (
          <span style={{ width: '16px' }} />
        )}
        <FiFolder size={16} color={node.color || '#6366f1'} />
        <span style={{ fontWeight: 500, color: '#111827' }}>{node.name}</span>
        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>/{node.slug}</span>
      </div>
      {expanded && hasChildren && node.children.map((child) => (
        <CategoryRow key={child.id} node={child} depth={depth + 1} />
      ))}
    </>
  );
}

export default function CategoriesPage() {
  const { data, error, isLoading } = useSWR(`${API}/inventory/categories`, fetcher);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Categories</h1>
        <Button variant="primary" onClick={() => {}}>
          <FiPlus size={16} /> New Category
        </Button>
      </div>

      {error && (
        <div style={{ padding: '16px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '8px' }}>
          Failed to load categories
        </div>
      )}

      {isLoading ? (
        <div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: '44px', backgroundColor: '#f3f4f6', marginBottom: '1px', animation: 'pulse 1.5s infinite' }} />
          ))}
          <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
        </div>
      ) : data?.categories?.length > 0 ? (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {data.categories.map((category: CategoryNode) => (
            <CategoryRow key={category.id} node={category} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
          <FiFolder size={48} style={{ margin: '0 auto 16px', display: 'block' }} />
          <p style={{ margin: 0, fontSize: '1.125rem' }}>No categories yet</p>
          <p style={{ margin: '8px 0 0', fontSize: '0.875rem' }}>Create categories to organize your products.</p>
        </div>
      )}
    </div>
  );
}
