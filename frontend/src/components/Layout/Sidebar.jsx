import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Receipt, Tag, PiggyBank,
  BarChart3, LogOut, Wallet, UserCircle, Menu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/expenses', icon: Receipt, label: 'Transactions' },
  { to: '/categories', icon: Tag, label: 'Categories' },
  { to: '/budgets', icon: PiggyBank, label: 'Budgets' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/profile', icon: UserCircle, label: 'Profile' },
];

export default function Sidebar({ open, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleIconClick = (to) => {
    if (!open) onToggle();
    navigate(to);
  };

  return (
    <aside
      style={{
        width: open ? '256px' : '64px',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        minWidth: open ? '256px' : '64px',
      }}
      className="flex-shrink-0 h-screen bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="h-16 border-b border-slate-800 flex items-center flex-shrink-0 px-3">
        {/* When open: logo + title + hamburger */}
        {open ? (
          <>
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Wallet size={18} className="text-white" />
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-none">ExpenseIQ</p>
              <p className="text-slate-400 text-xs mt-0.5">Finance Tracker</p>
            </div>
            <button
              onClick={onToggle}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Menu size={18} />
            </button>
          </>
        ) : (
          /* When closed: only hamburger centered */
          <button
            onClick={onToggle}
            className="w-full h-9 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 space-y-1 px-2 overflow-hidden">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={(e) => {
              if (!open) {
                e.preventDefault();
                handleIconClick(to);
              }
            }}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                open ? 'px-3 py-2.5' : 'p-2.5 justify-center'
              } ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <Icon size={20} className="flex-shrink-0" />
            {open && <span className="whitespace-nowrap">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-slate-800 p-2 flex-shrink-0">
        {open ? (
          <>
            <div className="flex items-center gap-3 px-2 py-2 mb-1">
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 bg-indigo-700 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                <p className="text-slate-400 text-xs truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl text-sm transition-all"
            >
              <LogOut size={18} className="flex-shrink-0" />
              <span>Sign Out</span>
            </button>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-1 py-1">
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 bg-indigo-700 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {initials}
                </div>
              )}
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
            >
              <LogOut size={18} />
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
