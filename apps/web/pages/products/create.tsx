import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { Button, Text } from '@stokku/ui';
import { FiPlus, FiTrash2, FiArrowLeft } from 'react-icons/fi';

const fetcher = (url: string) => {
  const token = localStorage.getItem('token');
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
};

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface VariantEntry {
  key: number;
  sku: string;
  name: string;
  price: string;
  costPrice: string;
  barcode: string;
}

export default function CreateProductPage() {
  const router = useRouter();
  const { data: categoriesData } = useSWR(`${API}/inventory/categories`, fetcher);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [baseUom, setBaseUom] = useState('pcs');
  const [tagsStr, setTagsStr] = useState('');
  const [variantKey, setVariantKey] = useState(1);
  const [variants, setVariants] = useState<VariantEntry[]>([
    { key: 0, sku: '', name: '', price: '', costPrice: '', barcode: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const addVariant = () => {
    setVariants([...variants, { key: variantKey, sku: '', name: '', price: '', costPrice: '', barcode: '' }]);
    setVariantKey(vk => vk + 1);
  };

  const removeVariant = (key: number) => {
    if (variants.length <= 1) return;
    setVariants(variants.filter(v => v.key !== key));
  };

  const updateVariant = (key: number, field: keyof VariantEntry, value: string) => {
    setVariants(variants.map(v => v.key === key ? { ...v, [field]: value } : v));
  };

  const categories = (categoriesData?.categories as any[]) || [];

  function flattenTree(nodes: any[], depth = 0): { id: string; label: string }[] {
    const result: { id: string; label: string }[] = [];
    for (const n of nodes) {
      result.push({ id: n.id, label: `${'  '.repeat(depth)}${n.name}` });
      if (n.children) result.push(...flattenTree(n.children, depth + 1));
    }
    return result;
  }

  const handleSubmit = async () => {
    if (!name.trim()) { alert('Product name is required'); return; }
    if (!variants[0]?.sku.trim()) { alert('At least one variant with SKU is required'); return; }

    setSubmitting(true);
    const token = localStorage.getItem('token');
    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);

    try {
      const res = await fetch(`${API}/inventory/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          categoryId: categoryId || undefined,
          baseUom,
          tags: tags.length > 0 ? tags : undefined,
          initialVariant: {
            sku: variants[0].sku.trim(),
            name: variants[0].name.trim() || name.trim(),
            price: variants[0].price ? parseFloat(variants[0].price) : undefined,
            costPrice: variants[0].costPrice ? parseFloat(variants[0].costPrice) : undefined,
            barcode: variants[0].barcode.trim() || undefined,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create product');
      }

      router.push('/products');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const s = (label: string) => ({ label });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6b7280' }}>
          <FiArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>New Product</h1>
      </div>

      <div style={{ display: 'grid', gap: '24px' }}>
        <section style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 600 }}>Product Details</h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="e.g. Organic Cotton T-Shirt" />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Product description..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Category</label>
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} style={inputStyle}>
                  <option value="">No category</option>
                  {flattenTree(categories).map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Base Unit of Measure</label>
                <select value={baseUom} onChange={e => setBaseUom(e.target.value)} style={inputStyle}>
                  {['pcs', 'kg', 'g', 'lb', 'oz', 'L', 'mL', 'm', 'cm', 'box', 'pack', 'pair'].map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Tags (comma-separated)</label>
              <input value={tagsStr} onChange={e => setTagsStr(e.target.value)} style={inputStyle} placeholder="e.g. premium, eco-friendly, summer-collection" />
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Variants</h2>
            <Button variant="outline" size="sm" onClick={addVariant}><FiPlus size={14} /> Add Variant</Button>
          </div>

          {variants.map((v, i) => (
            <div key={v.key} style={{ padding: '16px', marginBottom: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #f3f4f6', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#374151' }}>Variant {i + 1}</span>
                {variants.length > 1 && (
                  <button onClick={() => removeVariant(v.key)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>
                    <FiTrash2 size={14} /> Remove
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={labelStyle}>SKU *</label>
                  <input value={v.sku} onChange={e => updateVariant(v.key, 'sku', e.target.value)} style={inputStyle} placeholder="e.g. TSH-001-RED-L" />
                </div>
                <div>
                  <label style={labelStyle}>Variant Name</label>
                  <input value={v.name} onChange={e => updateVariant(v.key, 'name', e.target.value)} style={inputStyle} placeholder="e.g. Red / Large" />
                </div>
                <div>
                  <label style={labelStyle}>Price ($)</label>
                  <input type="number" step="0.01" min="0" value={v.price} onChange={e => updateVariant(v.key, 'price', e.target.value)} style={inputStyle} placeholder="0.00" />
                </div>
                <div>
                  <label style={labelStyle}>Cost Price ($)</label>
                  <input type="number" step="0.01" min="0" value={v.costPrice} onChange={e => updateVariant(v.key, 'costPrice', e.target.value)} style={inputStyle} placeholder="0.00" />
                </div>
                <div>
                  <label style={labelStyle}>Barcode</label>
                  <input value={v.barcode} onChange={e => updateVariant(v.key, 'barcode', e.target.value)} style={inputStyle} placeholder="EAN-13 / UPC-A" />
                </div>
              </div>
            </div>
          ))}
        </section>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>Create Product</Button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '0.875rem',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 500,
  color: '#374151',
  marginBottom: '4px',
};
