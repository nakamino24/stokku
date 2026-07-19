import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { FiBell, FiMenu } from 'react-icons/fi';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-60 flex-shrink-0 bg-white border-r border-gray-200 fixed top-0 left-0 bottom-0 overflow-y-auto z-30">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
      <div className="flex-1 min-h-screen lg:ml-60">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between lg:justify-end px-4 lg:px-6 gap-3 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            aria-label="Open menu"
          >
            <FiMenu size={20} />
          </button>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
              <FiBell size={18} />
            </button>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-semibold">
              {typeof window !== 'undefined' && JSON.parse(localStorage.getItem('user') || '{}')?.name?.[0] || 'U'}
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-6 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
