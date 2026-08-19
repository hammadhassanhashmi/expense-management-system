import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Download } from 'lucide-react';
import api from '../api/axios';
import { useCurrency } from '../hooks/useCurrency';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Reports() {
  const { format, symbol } = useCurrency();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/dashboard/summary?month=${month}&year=${year}`),
      api.get(`/expenses?start_date=${year}-${String(month).padStart(2,'0')}-01&end_date=${year}-${String(month).padStart(2,'0')}-31`),
    ]).then(([dash, exp]) => {
      setData(dash.data.data);
      setExpenses(exp.data.data);
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, [month, year]);

  const exportCSV = () => {
    const headers = ['Date','Title','Type','Category','Amount','Description'];
    const rows = expenses.map(e => [
      e.date?.split('T')[0] || e.date,
      `"${e.title}"`,
      e.type,
      e.category_name || 'Uncategorized',
      e.amount,
      `"${e.description || ''}"`,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `expenses-${year}-${month}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const trendData = (() => {
    if (!data?.trend) return [];
    const map = {};
    data.trend.forEach(({ month, year, type, total }) => {
      const key = `${year}-${String(month).padStart(2, '0')}`;
      if (!map[key]) map[key] = { name: MONTHS[month - 1], income: 0, expense: 0 };
      map[key][type] = parseFloat(total);
    });
    return Object.values(map);
  })();

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Reports & Analytics</h2>
          <p className="text-slate-400 mt-1">Detailed financial insights</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-medium transition border border-slate-700">
          <Download size={18} /> Export CSV
        </button>
      </div>

      {/* Period selector */}
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

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Income', value: data?.summary?.income || 0, color: 'text-emerald-400' },
              { label: 'Expenses', value: data?.summary?.expense || 0, color: 'text-red-400' },
              { label: 'Net Balance', value: data?.summary?.balance || 0, color: 'text-indigo-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
                <p className="text-slate-400 text-sm">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${color}`}>{format(Math.abs(parseFloat(value)))}</p>
              </div>
            ))}
          </div>

          {/* Bar chart - 6 month trend */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-6">6-Month Trend</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={trendData} barSize={20} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 12 }} />
                <YAxis stroke="#475569" tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} formatter={v => [format(v)]} />
                <Legend />
                <Bar dataKey="income" fill="#10b981" radius={[4,4,0,0]} name="Income" />
                <Bar dataKey="expense" fill="#ef4444" radius={[4,4,0,0]} name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">Expense by Category</h3>
              {data?.byCategory?.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={data.byCategory} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={50}>
                        {data.byCategory.map((entry, i) => <Cell key={i} fill={entry.color || '#6366f1'} />)}
                      </Pie>
                      <Tooltip formatter={v => [format(v)]} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-4">
                    {data.byCategory.map((cat, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-slate-300 text-sm">{cat.icon} {cat.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-white text-sm font-medium">{format(cat.total)}</span>
                          <span className="text-slate-500 text-xs ml-2">
                            ({data.summary?.expense > 0 ? ((cat.total / data.summary.expense) * 100).toFixed(1) : 0}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : <div className="flex items-center justify-center h-40 text-slate-500 text-sm">No expense data</div>}
            </div>

            {/* Recent transactions for month */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">All Transactions ({MONTHS[month-1]})</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {expenses.length > 0 ? expenses.slice(0, 15).map(e => (
                  <div key={e.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                    <div>
                      <p className="text-white text-sm">{e.title}</p>
                      <p className="text-slate-500 text-xs">{e.category_name || 'Uncategorized'}</p>
                    </div>
                    <span className={`text-sm font-medium ${e.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {e.type === 'income' ? '+' : '-'}{format(e.amount)}
                    </span>
                  </div>
                )) : <div className="text-center text-slate-500 text-sm py-8">No transactions this month</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
