import { useState } from 'react';
import useSWR from 'swr';
import { FiPlus, FiFolder, FiChevronRight, FiChevronDown } from 'react-icons/fi';
import { api } from '../utils/api';
import { Button, Card } from '@stokku/ui';

const fetcher = (url: string) => api.get<any[]>(url);

function CategoryRow({ node, depth = 0, onRefresh }: { node: any; depth?: number; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(node.name);
  const hasChildren = node.children?.length > 0;

  const handleSave = async () => {
    await api.put(`/categories/${node.id}`, { name });
    setEditing(false);
    onRefresh();
  };

  return (
    <>
      <div className={`flex items-center gap-2 px-4 py-2.5 border-b border-gray-50 hover:bg-gray-50 group`} style={{ paddingLeft: `${16 + depth * 24}px` }}>
        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)} className="text-gray-400">
            {expanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
          </button>
        ) : <span className="w-[14px]" />}
        <FiFolder size={15} color={node.color || '#6366f1'} />
        {editing ? (
          <input value={name} onChange={e => setName(e.target.value)}
            className="text-sm px-2 py-0.5 border border-gray-200 rounded outline-none focus:border-indigo-500"
            onBlur={handleSave} onKeyDown={e => e.key === 'Enter' && handleSave()} autoFocus />
        ) : (
          <span className="text-sm font-medium text-gray-800">{node.name}</span>
        )}
        <span className="text-[11px] text-gray-400">/{node.slug}</span>
        <span className="text-[11px] text-gray-400 ml-auto">{node._count?.products || 0} products</span>
        <button onClick={() => setEditing(true)}
          className="text-[11px] text-indigo-500 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
          Edit
        </button>
      </div>
      {expanded && hasChildren && node.children.map((child: any) => (
        <CategoryRow key={child.id} node={child} depth={depth + 1} onRefresh={onRefresh} />
      ))}
    </>
  );
}

export default function CategoriesPage() {
  const { data, error, isLoading, mutate } = useSWR('/categories', fetcher);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await api.post('/categories', { name: newName.trim() });
    setNewName('');
    setShowCreate(false);
    mutate();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 text-sm mt-1">Organize your products into categories</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <FiPlus size={16} /> New Category
        </Button>
      </div>

      {showCreate && (
        <Card className="p-4 mb-4 flex items-center gap-3 animate-fade-in">
          <input value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Category name..."
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 outline-none"
            onKeyDown={e => e.key === 'Enter' && handleCreate()} autoFocus />
          <Button variant="primary" onClick={handleCreate}>Create</Button>
          <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
        </Card>
      )}

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">Failed to load categories</div>}

      {isLoading ? (
        <div className="space-y-1">
          {[1,2,3,4].map(i => <div key={i} className="h-11 bg-gray-100 rounded animate-pulse" />)}
        </div>
      ) : data && data.length > 0 ? (
        <Card className="overflow-hidden">
          {data.map((cat: any) => (
            <CategoryRow key={cat.id} node={cat} onRefresh={mutate} />
          ))}
        </Card>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <FiFolder size={48} className="mx-auto mb-4" />
          <p className="text-lg">No categories yet</p>
          <p className="text-sm mt-2">Create categories to organize your products.</p>
        </div>
      )}
    </div>
  );
}
