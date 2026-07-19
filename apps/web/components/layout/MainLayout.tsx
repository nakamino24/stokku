import React from 'react';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <div
        style={{
          width: '260px',
          flexShrink: 0,
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e5e7eb',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          overflowY: 'auto',
        }}
      >
        <Sidebar />
      </div>
      <div style={{ marginLeft: '260px', flex: 1, minHeight: '100vh' }}>
        <main style={{ padding: '24px', maxWidth: '1200px' }}>{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;
