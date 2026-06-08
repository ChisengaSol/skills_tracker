import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

function AppLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;