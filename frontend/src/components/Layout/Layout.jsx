import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-30 transition-all duration-300 flex-shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:-translate-x-0 lg:w-0 lg:overflow-hidden'}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto min-w-0">
        {/* Top bar - always visible */}
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <Menu size={20} />
          </button>
          <span className="text-white font-semibold lg:hidden">ExpenseIQ</span>
        </div>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
