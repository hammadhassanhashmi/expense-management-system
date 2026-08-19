import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, X } from 'lucide-react';
import api from '../api/axios';
import Layout from '../components/Layout/Layout';
import toast from 'react-hot-toast';

const emptyForm = { title: '', amount: '', type: 'expense', date: new Date().toISOString().split('T')[0], category_id: '', description: '' };

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filters, setFilters] = useState({ search: '', type: '', category_id: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.type) params.set('type', filters.type);
      if (filters.category_id) params.set('category_id', filters.category_id);
      const [expRes, catRes] = await Promise.all([
        api.get(`/expenses?${params}`),
        api.get('/categories'),
      ]);
      setExpenses(expRes.data.data);
      setCategories(catRes.data.data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (exp) => {
    setEditing(exp.id);
    setForm({ title: exp.title, amount: exp.amount, type: exp.type, date: exp.date?.split('T')[0] || exp.date, category_id: exp.category_id || '', description: exp.description || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/expenses/${editing}`, form);
        toast.success('Transaction updated');
      } else {
        await api.post('/expenses', form);
        toast.success('Transaction added');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('Transaction deleted');
      fetchData();
    } catch { toast.error('Failed to delete'); }
  };

  const totalIncome = expenses.filter(e => e.type === 'income').reduce((s, e) => s + parseFloat(e.amount), 0);
  const totalExpense = expenses.filter(e => e.type === 'expense').reduce((s, e) => s + parseFloat(e.amount), 0);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Transactions</h2>
          <p className="text-slate-400 mt-1">Manage your income and expenses</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium transition">
          <Plus size={18} /> Add Transaction
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Income', value: totalIncome, color: 'text-emerald-400' },
          { label: 'Expenses', value: totalExpense, color: 'text-red-400' },
          { label: 'Balance', value: totalIncome - totalExpense, color: totalIncome - totalExpense >= 0 ? 'text-indigo-400' : 'text-amber-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <p className="text-slate-400 text-sm">{label}</p>
            <p className={`text-xl font-bold mt-1 ${color}`}>${Math.abs(value).toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            placeholder="Search transactions..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={filters.type}
          onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
          className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select
          value={filters.category_id}
          onChange={e => setFilters(f => ({ ...f, category_id: e.target.value }))}
          className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        {(filters.search || filters.type || filters.category_id) && (
          <button onClick={() => setFilters({ search: '', type: '', category_id: '' })} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm px-3 rounded-xl hover:bg-slate-800 transition">
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p className="text-lg mb-2">No transactions found</p>
            <p className="text-sm">Add your first transaction to get started</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                {['Transaction', 'Category', 'Date', 'Type', 'Amount', ''].map(h => (
                  <th key={h} className="text-left text-slate-400 text-xs font-medium uppercase tracking-wide px-6 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-800/50 transition">
                  <td className="px-6 py-4">
                    <p className="text-white font-medium text-sm">{exp.title}</p>
                    {exp.description && <p className="text-slate-500 text-xs mt-0.5 truncate max-w-xs">{exp.description}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span>{exp.category_icon || '📁'}</span>
                      <span className="text-slate-300 text-sm">{exp.category_name || 'Uncategorized'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${exp.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {exp.type.charAt(0).toUpperCase() + exp.type.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-semibold ${exp.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {exp.type === 'income' ? '+' : '-'}${parseFloat(exp.amount).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(exp)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleDelete(exp.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-semibold text-lg">{editing ? 'Edit' : 'Add'} Transaction</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Title</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500" placeholder="e.g., Monthly Salary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1.5">Amount</label>
                  <input required type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1.5">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500">
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1.5">Date</label>
                  <input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1.5">Category</label>
                  <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500">
                    <option value="">None</option>
                    {categories.filter(c => c.type === form.type).map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Description (optional)</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 resize-none h-20" placeholder="Add a note..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl transition">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-medium transition">
                  {editing ? 'Update' : 'Add'} Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
