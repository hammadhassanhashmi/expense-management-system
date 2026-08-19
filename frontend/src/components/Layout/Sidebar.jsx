import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Tag, PiggyBank, BarChart3, LogOut, Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/expenses', icon: Receipt, label: 'Transactions' },
  { to: '/categories', icon: Tag, label: 'Categories' },
  { to: '/budgets', icon: PiggyBank, label: 'Budgets' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 min-h-screen bg-slate-900 border-r border-slate-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Wallet size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">ExpenseIQ</h1>
            <p className="text-slate-400 text-xs mt-0.5">Smart Finance Tracker</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-indigo-700 rounded-full flex items-center justify-center text-lg">
            {user?.avatar || '👤'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-slate-400 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl text-sm transition-all"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
