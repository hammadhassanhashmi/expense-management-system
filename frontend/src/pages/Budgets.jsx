import { useState, useEffect } from 'react';
import { Plus, X, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../api/axios';
import Layout from '../components/Layout/Layout';
import toast from 'react-hot-toast';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function Budgets() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ category_id: '', amount: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, cRes] = await Promise.all([
        api.get(`/budgets?month=${month}&year=${year}`),
        api.get('/categories'),
      ]);
      setBudgets(bRes.data.data);
      setCategories(cRes.data.data.filter(c => c.type === 'expense'));
    } catch { toast.error('Failed to load budgets'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [month, year]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/budgets', { ...form, month, year });
      toast.success('Budget saved');
      setShowModal(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save budget'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this budget?')) return;
    try {
      await api.delete(`/budgets/${id}`);
      toast.success('Budget removed');
      fetchData();
    } catch { toast.error('Failed to remove'); }
  };

  const totalBudget = budgets.reduce((s, b) => s + parseFloat(b.amount), 0);
  const totalSpent = budgets.reduce((s, b) => s + parseFloat(b.spent), 0);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Budget Tracker</h2>
          <p className="text-slate-400 mt-1">Set and track your monthly spending limits</p>
        </div>
        <button onClick={() => { setForm({ category_id: '', amount: '' }); setShowModal(true); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium transition">
          <Plus size={18} /> Set Budget
        </button>
      </div>

      {/* Month/Year selector */}
      <div className="flex gap-3 mb-6">
        <select value={month} onChange={e => setMonth(Number(e.target.value))}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500">
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(Number(e.target.value))}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500">
          {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Overall summary */}
      {budgets.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Overall Budget Usage</span>
            <span className="text-white font-semibold">${totalSpent.toFixed(2)} / ${totalBudget.toFixed(2)}</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${totalSpent / totalBudget > 0.9 ? 'bg-red-500' : totalSpent / totalBudget > 0.7 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
            />
          </div>
          <p className="text-slate-400 text-xs mt-2">{((totalSpent / totalBudget) * 100).toFixed(1)}% of total budget used</p>
        </div>
      )}

      {/* Budget cards */}
      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <p className="text-lg mb-2">No budgets set for {MONTHS[month - 1]} {year}</p>
          <p className="text-sm">Set budgets to track your spending</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map(b => {
            const pct = parseFloat(b.amount) > 0 ? (parseFloat(b.spent) / parseFloat(b.amount)) * 100 : 0;
            const over = pct > 100;
            return (
              <div key={b.id} className={`bg-slate-900 border rounded-2xl p-5 ${over ? 'border-red-800' : 'border-slate-800'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: b.color + '22' }}>
                      {b.icon}
                    </div>
                    <div>
                      <p className="text-white font-medium">{b.category_name}</p>
                      <p className="text-slate-400 text-xs">{MONTHS[month - 1]} {year}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {over ? <AlertTriangle size={16} className="text-red-400" /> : pct >= 80 ? <AlertTriangle size={16} className="text-amber-400" /> : <CheckCircle size={16} className="text-emerald-400" />}
                    <button onClick={() => handleDelete(b.id)} className="text-slate-500 hover:text-red-400 p-1 rounded-lg transition"><X size={14} /></button>
                  </div>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Spent: <span className={over ? 'text-red-400' : 'text-white'}>${parseFloat(b.spent).toFixed(2)}</span></span>
                  <span className="text-slate-400">Budget: <span className="text-white">${parseFloat(b.amount).toFixed(2)}</span></span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all ${over ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <p className={`text-xs mt-2 ${over ? 'text-red-400' : 'text-slate-400'}`}>
                  {over ? `Over budget by $${(parseFloat(b.spent) - parseFloat(b.amount)).toFixed(2)}` : `$${(parseFloat(b.amount) - parseFloat(b.spent)).toFixed(2)} remaining`}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-semibold text-lg">Set Budget</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Category</label>
                <select required value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Budget Amount</label>
                <input required type="number" step="0.01" min="1" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500" placeholder="0.00" />
              </div>
              <p className="text-slate-400 text-xs">For {MONTHS[month - 1]} {year}</p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl transition">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-medium transition">Save Budget</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
