import { useState } from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex bg-slate-950" style={{ minHeight: '100vh' }}>
      {/* Mobile overlay */}
      <div
        onClick={() => setSidebarOpen(false)}
        className={`fixed inset-0 bg-black/60 z-20 lg:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sidebar — smooth width transition handled inside Sidebar */}
      <div style={{ transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)', width: sidebarOpen ? '256px' : '64px', flexShrink: 0 }} className="sticky top-0 h-screen">
        <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(v => !v)} />
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
