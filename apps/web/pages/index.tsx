import { useState, useEffect } from 'react';
import { FiUsers, FiBarChart2, FiCalendar, FiCheckCircle, FiAlertTriangle, FiPackage, FiGrid, FiTruck, FiArchive, FiTrendingUp } from 'react-icons/fi';
import Link from 'next/link';
import axios from 'axios';
import MainLayout from '../components/layout/MainLayout';
import { Card, Spinner } from '@stokku/ui';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProjects: 0, totalTasks: 0, completedTasks: 0, overdueTasks: 0,
  });
  const [invStats, setInvStats] = useState({
    totalProducts: 0, totalVariants: 0, totalWarehouses: 0, totalSuppliers: 0,
    lowStockItems: 0, recentMovements: 0,
  });
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem('accessToken') || localStorage.getItem('token');
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const headers = { Authorization: `Bearer ${getToken()}` };

        const [statsRes, invRes] = await Promise.all([
          axios.get(`${baseUrl}/dashboard/stats`, { headers }),
          axios.get(`${baseUrl}/dashboard/inventory-stats`, { headers }),
        ]);

        setStats(statsRes.data);
        setInvStats(invRes.data);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <MainLayout><div className="flex justify-center py-12"><Spinner /></div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your workspace</p>
        </div>

        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Project Management</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={FiUsers} label="Projects" value={stats.totalProjects} color="indigo" />
            <StatCard icon={FiBarChart2} label="Total Tasks" value={stats.totalTasks} color="blue" />
            <StatCard icon={FiCheckCircle} label="Completed" value={stats.completedTasks} color="green" />
            <StatCard icon={FiAlertTriangle} label="Overdue" value={stats.overdueTasks} color="red" />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Inventory</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard icon={FiPackage} label="Products" value={invStats.totalProducts} sub={`${invStats.totalVariants} variants`} color="violet" />
            <StatCard icon={FiArchive} label="Warehouses" value={invStats.totalWarehouses} color="violet" />
            <StatCard icon={FiTruck} label="Suppliers" value={invStats.totalSuppliers} color="violet" />
            {invStats.lowStockItems > 0 && (
              <StatCard icon={FiAlertTriangle} label="Low Stock Items" value={invStats.lowStockItems} color="red" />
            )}
            <StatCard icon={FiTrendingUp} label="Movements (7d)" value={invStats.recentMovements} color="violet" />
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Link href="/products" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <FiPackage className="w-4 h-4" /> View Products
          </Link>
          <Link href="/warehouses" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <FiArchive className="w-4 h-4" /> View Warehouses
          </Link>
          <Link href="/suppliers" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <FiTruck className="w-4 h-4" /> View Suppliers
          </Link>
          <Link href="/projects" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <FiBarChart2 className="w-4 h-4" /> View Projects
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: number; sub?: string; color: string;
}) {
  const colors: Record<string, string> = {
    indigo: 'text-indigo-500 bg-indigo-50',
    blue: 'text-blue-500 bg-blue-50',
    green: 'text-green-500 bg-green-50',
    red: 'text-red-500 bg-red-50',
    violet: 'text-violet-500 bg-violet-50',
  };

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-lg ${colors[color] || colors.indigo}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </Card>
  );
}

export default Dashboard;
