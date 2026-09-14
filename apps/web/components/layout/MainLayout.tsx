import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { FiBell, FiMenu, FiMoon, FiSun } from 'react-icons/fi';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolvedTheme = storedTheme === 'dark' || storedTheme === 'light'
      ? storedTheme
      : prefersDark ? 'dark' : 'light';

    setTheme(resolvedTheme);
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div className="flex min-h-screen bg-(--bg-page) text-(--text-primary)">
      <div className="w-60 shrink-0 bg-(--bg-card) border-r border-(--border) fixed top-0 left-0 bottom-0 overflow-y-auto z-30 shadow-(--shadow-soft)">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
      <div className="flex-1 min-h-screen lg:ml-60 bg-(--bg-shell)">
        <header className="h-16 bg-(--bg-card)/90 border-b border-(--border) flex items-center justify-between lg:justify-end px-4 lg:px-6 gap-3 sticky top-0 z-20 backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-card-muted) transition-all"
            aria-label="Open menu"
          >
            <FiMenu size={20} />
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
              className="p-2 rounded-lg text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-card-muted) transition-all"
              aria-label="Toggle color mode"
            >
              {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
            <button className="p-2 rounded-lg text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-card-muted) transition-all">
              <FiBell size={18} />
            </button>
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-300 text-sm font-semibold">
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
