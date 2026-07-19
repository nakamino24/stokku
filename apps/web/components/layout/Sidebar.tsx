import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiLogOut, FiUsers, FiBarChart2, FiHome, FiSettings, FiPackage, FiGrid, FiTruck, FiArchive } from 'react-icons/fi';

const Sidebar = () => {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  const isActive = (path: string) => router.pathname === path || router.pathname.startsWith(path + '/');

  const linkStyle = (path: string): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: isActive(path) ? '#4f46e5' : '#374151',
    backgroundColor: isActive(path) ? '#eef2ff' : 'transparent',
    textDecoration: 'none',
    transition: 'all 150ms ease',
  });

  return (
    <nav
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '16px',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', marginBottom: '16px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: '#4f46e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.875rem',
          }}
        >
          S
        </div>
        <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>Stokku</span>
      </div>

      <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', padding: '4px 12px' }}>
        Overview
      </div>
      <Link href="/" style={linkStyle('/')}><FiHome size={18} /> Dashboard</Link>

      <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', padding: '4px 12px', marginTop: '16px' }}>
        Inventory
      </div>
      <Link href="/products" style={linkStyle('/products')}><FiPackage size={18} /> Products</Link>
      <Link href="/categories" style={linkStyle('/categories')}><FiGrid size={18} /> Categories</Link>
      <Link href="/suppliers" style={linkStyle('/suppliers')}><FiTruck size={18} /> Suppliers</Link>
      <Link href="/warehouses" style={linkStyle('/warehouses')}><FiArchive size={18} /> Warehouses</Link>

      <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', padding: '4px 12px', marginTop: '16px' }}>
        Projects
      </div>
      <Link href="/projects" style={linkStyle('/projects')}><FiUsers size={18} /> Projects</Link>
      <Link href="/analytics" style={linkStyle('/analytics')}><FiBarChart2 size={18} /> Analytics</Link>

      <div style={{ flex: 1 }} />

      <Link href="/settings" style={linkStyle('/settings')}><FiSettings size={18} /> Settings</Link>
      <button
        onClick={handleLogout}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 12px',
          borderRadius: '8px',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: '#dc2626',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left',
        }}
      >
        <FiLogOut size={18} /> Logout
      </button>
    </nav>
  );
};

export default Sidebar;
