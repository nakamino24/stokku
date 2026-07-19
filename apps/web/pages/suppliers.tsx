import { useState } from 'react';
import useSWR from 'swr';
import { FiPlus, FiSearch, FiTruck, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { Button } from '@stokku/ui';

const fetcher = (url: string) => {
  const token = localStorage.getItem('token');
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(async (res) => {
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to fetch'); }
    return res.json();
  });
};

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', paymentTerms: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const query = new URLSearchParams({ page: String(page), limit: '20' });
  if (search) query.set('search', search);

  const { data, error, isLoading, mutate } = useSWR(`${API}/inventory/suppliers?${query}`, fetcher);

  const handleCreate = async () => {
    if (!form.name) return;
    setSubmitting(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/inventory/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to create');
      setShowForm(false);
      setForm({ name: '', email: '', phone: '', address: '', paymentTerms: '', notes: '' });
      mutate();
    } catch {
      alert('Failed to create supplier');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this supplier?')) return;
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API}/inventory/suppliers/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      mutate();
    } catch { alert('Failed to delete'); }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Suppliers</h1>
        <Button variant="primary" onClick={() => setShowForm(!showForm)}>
          <FiPlus size={16} /> {showForm ? 'Cancel' : 'New Supplier'}
        </Button>
      </div>

      {showForm && (
        <div style={{ padding: '20px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontWeight: 600 }}>New Supplier</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <input placeholder="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              style={inputStyle} />
            <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              style={inputStyle} />
            <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              style={inputStyle} />
            <input placeholder="Payment Terms (e.g. Net 30)" value={form.paymentTerms} onChange={e => setForm({ ...form, paymentTerms: e.target.value })}
              style={inputStyle} />
            <input placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
              style={{ ...inputStyle, gridColumn: '1 / -1' }} />
            <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              style={{ ...inputStyle, gridColumn: '1 / -1', minHeight: '60px', resize: 'vertical' }} />
          </div>
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <Button variant="primary" onClick={handleCreate} loading={submitting}>Create Supplier</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '16px', position: 'relative' }}>
        <FiSearch size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
        <input type="text" placeholder="Search suppliers..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ width: '100%', padding: '10px 12px 10px 40px', fontSize: '0.875rem', borderRadius: '8px', border: '1px solid #e5e7eb', outline: 'none', boxSizing: 'border-box' }} />
      </div>

      {error && <div style={{ padding: '16px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '8px', marginBottom: '16px' }}>Failed to load suppliers</div>}

      {isLoading ? (
        <div>{[1,2,3].map(i => <div key={i} style={{ height: '72px', backgroundColor: '#f3f4f6', borderRadius: '8px', marginBottom: '8px', animation: 'pulse 1.5s infinite' }} />)}
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        </div>
      ) : data?.suppliers?.length > 0 ? (
        <div style={{ display: 'grid', gap: '12px' }}>
          {data.suppliers.map((s: any) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                  <FiTruck size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#111827' }}>{s.name}</div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
                    {s.email && <span><FiMail size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />{s.email}</span>}
                    {s.phone && <span><FiPhone size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />{s.phone}</span>}
                    {s.paymentTerms && <span>{s.paymentTerms}</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => handleDelete(s.id)}
                style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px' }}>
                Delete
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
          <FiTruck size={48} style={{ margin: '0 auto 16px', display: 'block' }} />
          <p style={{ margin: 0, fontSize: '1.125rem' }}>No suppliers yet</p>
          <p style={{ margin: '8px 0 0', fontSize: '0.875rem' }}>Add your first supplier to start managing purchases.</p>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: '0.875rem',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};
