import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FiHome, FiPackage, FiGrid, FiTruck, FiArchive, FiShoppingCart,
  FiDollarSign, FiUsers, FiBarChart2, FiSettings, FiLogOut,
  FiLayers, FiUserCheck, FiFileText, FiX, FiMenu,
} from 'react-icons/fi';
import { clearTokens } from '../../utils/api';

const navigation = [
  { section: 'Overview', items: [
    { href: '/', label: 'Dashboard', icon: FiHome },
  ]},
  { section: 'Inventory', items: [
    { href: '/products', label: 'Products', icon: FiPackage },
    { href: '/categories', label: 'Categories', icon: FiGrid },
    { href: '/stock', label: 'Stock Levels', icon: FiLayers },
  ]},
  { section: 'Warehouses', items: [
    { href: '/warehouses', label: 'Warehouses', icon: FiArchive },
  ]},
  { section: 'Purchasing', items: [
    { href: '/purchase-orders', label: 'Purchase Orders', icon: FiShoppingCart },
    { href: '/suppliers', label: 'Suppliers', icon: FiTruck },
  ]},
  { section: 'Sales', items: [
    { href: '/sales-orders', label: 'Sales Orders', icon: FiFileText },
    { href: '/customers', label: 'Customers', icon: FiUserCheck },
  ]},
  { section: 'Reports', items: [
    { href: '/reports', label: 'Reports', icon: FiBarChart2 },
  ]},
  { section: 'Administration', items: [
    { href: '/users', label: 'Users', icon: FiUsers },
    { href: '/settings', label: 'Settings', icon: FiSettings },
  ]},
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const router = useRouter();

  const isActive = (path: string) => {
    if (path === '/') return router.pathname === '/';
    return router.pathname.startsWith(path);
  };

  const handleLogout = () => {
    clearTokens();
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <nav className={`
        flex flex-col h-full p-4 gap-1
        fixed lg:static inset-y-0 left-0 z-50 w-60
        bg-white border-r border-gray-200
        transition-transform duration-200
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      <div className="flex items-center gap-3 px-3 py-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
          S
        </div>
        <span className="text-lg font-bold text-gray-900">Stokku</span>
      </div>

      {navigation.map((group) => (
        <div key={group.section}>
          <div className="text-[0.65rem] font-semibold uppercase tracking-widest text-gray-400 px-3 py-1.5 mt-2">
            {group.section}
          </div>
          {group.items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}

      <div className="flex-1" />

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-150 w-full text-left"
      >
        <FiLogOut size={17} />
        Logout
      </button>
    </nav>
    </>
  );
};

export default Sidebar;
