import { useState, useRef } from 'react';
import { Camera, User, Mail, Lock, Trash2, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Layout from '../components/Layout/Layout';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const fileRef = useRef(null);

  const getAvatarUrl = () => {
    if (previewUrl) return previewUrl;
    if (user?.avatar && user.avatar.startsWith('uploads/')) {
      return `http://localhost:5000/${user.avatar}`;
    }
    return null;
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target.result);
    reader.readAsDataURL(file);

    // Upload
    setAvatarLoading(true);
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await api.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser({ ...user, avatar: res.data.avatar });
      toast.success('Profile picture updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
      setPreviewUrl(null);
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarLoading(true);
    try {
      await api.delete('/auth/avatar');
      updateUser({ ...user, avatar: null });
      setPreviewUrl(null);
      toast.success('Profile picture removed');
    } catch {
      toast.error('Failed to remove picture');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await api.put('/auth/profile', profileForm);
      updateUser(res.data.user);
      toast.success('Profile updated successfully!');
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

  const avatarUrl = getAvatarUrl();
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Profile Settings</h2>
        <p className="text-slate-400 mt-1">Manage your account information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Avatar Card */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
            <div className="relative inline-block mb-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-28 h-28 rounded-full object-cover ring-4 ring-indigo-600/30"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-indigo-700 flex items-center justify-center ring-4 ring-indigo-600/30">
                  <span className="text-white text-3xl font-bold">{initials}</span>
                </div>
              )}

              {/* Camera button */}
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

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <h3 className="text-white font-semibold text-lg">{user?.name}</h3>
            <p className="text-slate-400 text-sm mt-1">{user?.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-indigo-600/20 text-indigo-400 text-xs rounded-lg capitalize">
              {user?.role}
            </span>

            <div className="mt-4 space-y-2">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={avatarLoading}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl text-sm transition disabled:opacity-50"
              >
                <Camera size={16} />
                Change Picture
              </button>

              {(user?.avatar || previewUrl) && (
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
                <span className="text-slate-400">Account type</span>
                <span className="text-white capitalize">{user?.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Forms */}
        <div className="lg:col-span-2 space-y-6">

          {/* Update Profile */}
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
                  value={profileForm.name}
                  onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={profileForm.email}
                    onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                    placeholder="your@email.com"
                  />
                </div>
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
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-slate-700 focus:border-indigo-500'
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
                disabled={passwordLoading || (passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium transition"
              >
                <Lock size={16} />
                {passwordLoading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </Layout>
  );
}
