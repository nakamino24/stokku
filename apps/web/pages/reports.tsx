import { useState } from 'react';
import useSWR from 'swr';
import { FiBarChart2, FiTrendingUp, FiDollarSign, FiClock } from 'react-icons/fi';
import { api } from '../utils/api';
import { Card, Spinner } from '@stokku/ui';

const fetcher = (url: string) => api.get<any>(url);

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('stock-value');

  const { data: stockValue, error: svErr, isLoading: svLoading } = useSWR(
    activeTab === 'stock-value' ? '/reports/stock-value' : null, fetcher
  );

  const { data: valuation, error: valErr, isLoading: valLoading } = useSWR(
    activeTab === 'valuation' ? '/reports/inventory-valuation' : null, fetcher
  );

  const { data: auditLog, error: auditErr, isLoading: auditLoading } = useSWR(
    activeTab === 'audit' ? '/reports/audit-log?limit=50' : null, fetcher
  );

  const tabs = [
    { id: 'stock-value', label: 'Stock Value', icon: FiDollarSign },
    { id: 'valuation', label: 'Valuation', icon: FiTrendingUp },
    { id: 'audit', label: 'Audit Trail', icon: FiClock },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 text-sm mt-1">Insights into your inventory operations</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all ${
                activeTab === tab.id ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'stock-value' && (
        svLoading ? <div className="py-12 text-center"><Spinner /></div> :
        svErr ? <div className="p-4 bg-red-50 text-red-700 rounded-lg">Failed to load report</div> :
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-5">
              <p className="text-sm text-gray-500">Total Cost Value</p>
              <p className="text-2xl font-bold text-gray-900">${stockValue?.totalCostValue?.toFixed(2)}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-gray-500">Total Retail Value</p>
              <p className="text-2xl font-bold text-gray-900">${stockValue?.totalRetailValue?.toFixed(2)}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-gray-500">Potential Profit</p>
              <p className="text-2xl font-bold text-green-600">${stockValue?.potentialProfit?.toFixed(2)}</p>
            </Card>
          </div>
          <Card className="overflow-hidden">
            <div className="divide-y divide-gray-100">
              {stockValue?.items?.slice(0, 20).map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 text-sm">
                  <span className="text-gray-700">{item.product}</span>
                  <span className="text-gray-400 text-xs">{item.warehouse}</span>
                  <span className="text-gray-500">{item.quantity} units</span>
                  <span className="font-medium text-gray-900">${item.totalCost?.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'valuation' && (
        valLoading ? <div className="py-12 text-center"><Spinner /></div> :
        valErr ? <div className="p-4 bg-red-50 text-red-700 rounded-lg">Failed to load report</div> :
        <div>
          <Card className="p-5 mb-4">
            <p className="text-sm text-gray-500">Total Inventory Value</p>
            <p className="text-3xl font-bold text-gray-900">${valuation?.totalValue?.toFixed(2)}</p>
          </Card>
          <Card className="overflow-hidden">
            <div className="divide-y divide-gray-100">
              {valuation?.items?.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 text-sm">
                  <span className="text-gray-700">{item.product}</span>
                  <span className="text-gray-400 text-xs">SKU: {item.sku || '—'}</span>
                  <span className="text-gray-500">{item.totalQuantity} units</span>
                  <span className="font-medium text-gray-900">${item.totalValue?.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'audit' && (
        auditLoading ? <div className="py-12 text-center"><Spinner /></div> :
        auditErr ? <div className="p-4 bg-red-50 text-red-700 rounded-lg">Failed to load audit log</div> :
        <Card className="overflow-hidden">
          <div className="divide-y divide-gray-100">
            {auditLog?.data?.map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between p-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    entry.action === 'CREATE' ? 'bg-green-50 text-green-700' :
                    entry.action === 'UPDATE' ? 'bg-blue-50 text-blue-700' :
                    entry.action === 'DELETE' ? 'bg-red-50 text-red-700' :
                    entry.action === 'LOGIN' ? 'bg-gray-50 text-gray-700' :
                    'bg-gray-50 text-gray-700'
                  }`}>{entry.action}</span>
                  <span className="text-gray-700">{entry.entityType}</span>
                  <span className="text-gray-400 text-xs">{entry.user?.name}</span>
                </div>
                <span className="text-xs text-gray-400">{new Date(entry.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
