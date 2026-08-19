import { useState, useRef, useEffect } from 'react';
import { Camera, User, Lock, Trash2, Save, DollarSign, ChevronDown, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CURRENCIES } from '../hooks/useCurrency';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const currencyRef = useRef(null);

  const fileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (currencyRef.current && !currencyRef.current.contains(e.target)) {
        setCurrencyOpen(false);
        setCurrencySearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getAvatarSrc = () => user?.avatar || null;

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setAvatarLoading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      try {
        const res = await api.post('/auth/avatar', { avatar: base64 });
        updateUser({ ...user, avatar: res.data.avatar });
        toast.success('Profile picture updated!');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Upload failed');
      } finally {
        setAvatarLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = async () => {
    setAvatarLoading(true);
    try {
      await api.delete('/auth/avatar');
      updateUser({ ...user, avatar: null });
      toast.success('Profile picture removed');
    } catch {
      toast.error('Failed to remove picture');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleCurrencyChange = async (newCurrency) => {
    setCurrency(newCurrency);
    try {
      const res = await api.put('/auth/profile', { name: user.name, email: user.email, currency: newCurrency });
      updateUser({ ...user, ...res.data.user, currency: newCurrency });
      toast.success(`Currency changed to ${newCurrency}`);
    } catch (err) {
      console.error('Currency error:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to update currency');
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await api.put('/auth/profile', { name, currency });
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setPasswordLoading(true);
    try {
      await api.put('/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Profile Settings</h2>
        <p className="text-slate-400 mt-1">Manage your account information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Avatar Card */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
            <div className="relative inline-block mb-4">
              {getAvatarSrc() ? (
                <img
                  src={getAvatarSrc()}
                  alt="Profile"
                  className="w-28 h-28 rounded-full object-cover ring-4 ring-indigo-600/30"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-indigo-700 flex items-center justify-center ring-4 ring-indigo-600/30">
                  <span className="text-white text-3xl font-bold">{initials}</span>
                </div>
              )}

              <button
                onClick={() => fileRef.current?.click()}
                disabled={avatarLoading}
                className="absolute bottom-0 right-0 w-9 h-9 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center shadow-lg transition disabled:opacity-50"
              >
                {avatarLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera size={16} className="text-white" />
                )}
              </button>

              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>

            <h3 className="text-white font-semibold text-lg">{user?.name}</h3>
            <p className="text-slate-400 text-sm mt-1">{user?.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-indigo-600/20 text-indigo-400 text-xs rounded-lg capitalize">
              {user?.role}
            </span>

            <div className="mt-5 space-y-2">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={avatarLoading}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl text-sm transition disabled:opacity-50"
              >
                <Camera size={16} />
                {avatarLoading ? 'Uploading...' : 'Change Picture'}
              </button>

              {user?.avatar && (
                <button
                  onClick={handleRemoveAvatar}
                  disabled={avatarLoading}
                  className="w-full flex items-center justify-center gap-2 text-red-400 hover:bg-red-400/10 py-2.5 rounded-xl text-sm transition disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Remove Picture
                </button>
              )}
            </div>

            <p className="text-slate-500 text-xs mt-4">JPG, PNG or GIF · Max 2MB</p>
          </div>

          {/* Account Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mt-4">
            <h4 className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-3">Account Info</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Member since</span>
                <span className="text-white">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Role</span>
                <span className="text-white capitalize">{user?.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Forms */}
        <div className="lg:col-span-2 space-y-6">

          {/* Update Name */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
              <User size={18} className="text-indigo-400" />
              Personal Information
            </h3>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed"
                />
                <p className="text-slate-600 text-xs mt-1">Email cannot be changed</p>
              </div>
              <button
                type="submit"
                disabled={profileLoading}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium transition"
              >
                <Save size={16} />
                {profileLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
              <Lock size={18} className="text-indigo-400" />
              Change Password
            </h3>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  placeholder="Enter current password"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1.5">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                    placeholder="Min. 6 characters"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none transition ${
                      passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword
                        ? 'border-red-500' : 'border-slate-700 focus:border-indigo-500'
                    }`}
                    placeholder="Repeat new password"
                  />
                </div>
              </div>
              {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                <p className="text-red-400 text-xs">Passwords do not match</p>
              )}
              <button
                type="submit"
                disabled={passwordLoading || !!(passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium transition"
              >
                <Lock size={16} />
                {passwordLoading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>

          {/* Currency */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
              <DollarSign size={18} className="text-indigo-400" />
              Currency Preference
            </h3>
            <div className="relative" ref={currencyRef}>
              {/* Trigger */}
              <button
                type="button"
                onClick={() => { setCurrencyOpen(v => !v); setCurrencySearch(''); }}
                className="w-full flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition"
              >
                <span>
                  {CURRENCIES[currency]?.symbol} {currency} — {CURRENCIES[currency]?.name}
                </span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${currencyOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              {currencyOpen && (
                <div className="absolute z-50 mt-2 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                  {/* Search */}
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700">
                    <Search size={14} className="text-slate-400 flex-shrink-0" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search currency..."
                      value={currencySearch}
                      onChange={e => setCurrencySearch(e.target.value)}
                      className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                  {/* Options */}
                  <div className="max-h-52 overflow-y-auto">
                    {Object.entries(CURRENCIES)
                      .filter(([code, { name }]) =>
                        code.toLowerCase().includes(currencySearch.toLowerCase()) ||
                        name.toLowerCase().includes(currencySearch.toLowerCase())
                      )
                      .map(([code, { symbol, name }]) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => { handleCurrencyChange(code); setCurrencyOpen(false); setCurrencySearch(''); }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition hover:bg-slate-700 ${currency === code ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-300'}`}
                        >
                          <span className="w-6 text-center flex-shrink-0">{symbol}</span>
                          <span className="font-medium">{code}</span>
                          <span className="text-slate-400">{name}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
            <p className="text-slate-500 text-xs mt-3">Select currency — applies instantly across all pages</p>
          </div>

        </div>
      </div>
    </>
  );
}
