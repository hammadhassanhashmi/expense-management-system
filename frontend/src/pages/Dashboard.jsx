import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../api/axios';
import { useCurrency } from '../hooks/useCurrency';
import { useAuth } from '../context/AuthContext';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function SummaryCard({ title, amount, icon: Icon, color, trend, format }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-slate-400 text-sm">{title}</p>
      <p className="text-white text-2xl font-bold mt-1">{format ? format(amount || 0) : `$${parseFloat(amount||0).toFixed(2)}`}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { format, symbol } = useCurrency();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();

  useEffect(() => {
    api.get(`/dashboard/summary?month=${now.getMonth() + 1}&year=${now.getFullYear()}`)
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Build trend chart data
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Good {now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋</h2>
        <p className="text-slate-400 mt-1">Here's your financial overview for {MONTHS[now.getMonth()]} {now.getFullYear()}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SummaryCard title="Total Income" amount={data?.summary?.income} icon={TrendingUp} color="bg-emerald-600" format={format} />
        <SummaryCard title="Total Expenses" amount={data?.summary?.expense} icon={TrendingDown} color="bg-red-600" format={format} />
        <SummaryCard
          title="Net Balance"
          amount={data?.summary?.balance}
          icon={DollarSign}
          color={data?.summary?.balance >= 0 ? 'bg-indigo-600' : 'bg-amber-600'}
          format={format}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-6">Income vs Expenses (6 Months)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 12 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 12 }} tickFormatter={v => `${symbol}${v}`} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                labelStyle={{ color: '#e2e8f0' }}
                formatter={v => [format(v)]}
              />
              <Legend />
              <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#incomeGrad)" strokeWidth={2} name="Income" />
              <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2} name="Expense" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Expenses by Category</h3>
          {data?.byCategory?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={data.byCategory} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {data.byCategory.map((entry, i) => (
                      <Cell key={i} fill={entry.color || '#6366f1'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={v => [format(v)]} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {data.byCategory.slice(0, 4).map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{cat.icon}</span>
                      <span className="text-slate-300">{cat.name}</span>
                    </div>
                    <span className="text-white font-medium">{format(cat.total)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-500 text-sm">No expense data</div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-semibold">Recent Transactions</h3>
          <a href="/expenses" className="text-indigo-400 text-sm hover:text-indigo-300">View all →</a>
        </div>
        {data?.recent?.length > 0 ? (
          <div className="space-y-3">
            {data.recent.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ backgroundColor: (tx.category_color || '#6366f1') + '22' }}>
                    {tx.category_icon || '💳'}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{tx.title}</p>
                    <p className="text-slate-400 text-xs">{tx.category_name || 'Uncategorized'} · {new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`font-semibold ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.type === 'income' ? '+' : '-'}{format(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-slate-500 py-12">
            <p>No transactions yet. Add your first one!</p>
          </div>
        )}
      </div>
    </>
  );
}
