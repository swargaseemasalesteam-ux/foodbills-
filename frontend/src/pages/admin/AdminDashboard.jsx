import React, { useState, useEffect } from 'react';
import { getBillsApi, getAgentsApi } from '../../api/client';
import {
  Receipt,
  IndianRupee,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Calendar,
  TrendingUp,
  ArrowUpRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';

const AdminDashboard = () => {
  const [bills, setBills] = useState([]);
  const [agents, setAgents] = useState([]);
  const [summary, setSummary] = useState({
    totalBills: 0,
    totalAmount: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0
  });
  const [loading, setLoading] = useState(true);

  // Calculate current 15-day period string
  const getCurrentPeriodStr = () => {
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleString('default', { month: 'short' });
    const year = now.getFullYear();
    if (day <= 15) {
      return `01 ${month} - 15 ${month} ${year}`;
    } else {
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      return `16 ${month} - ${lastDay} ${month} ${year}`;
    }
  };

  useEffect(() => {
    Promise.all([
      getBillsApi({ limit: 100 }),
      getAgentsApi()
    ])
      .then(([billsRes, agentsRes]) => {
        setBills(billsRes.data.bills);
        setSummary(billsRes.data.summary);
        setAgents(agentsRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Prepare chart data: Food Expenses by Agent
  const agentChartMap = {};
  bills.forEach((b) => {
    if (!agentChartMap[b.agentName]) {
      agentChartMap[b.agentName] = 0;
    }
    agentChartMap[b.agentName] += b.amount;
  });
  const agentChartData = Object.keys(agentChartMap).map((name) => ({
    name,
    Amount: agentChartMap[name]
  }));

  // Prepare chart data: Food Expenses by Day
  const dayChartMap = {};
  bills.forEach((b) => {
    const dStr = new Date(b.date).toISOString().split('T')[0];
    if (!dayChartMap[dStr]) {
      dayChartMap[dStr] = 0;
    }
    dayChartMap[dStr] += b.amount;
  });
  const dayChartData = Object.keys(dayChartMap)
    .sort()
    .map((date) => ({
      date,
      Amount: dayChartMap[date]
    }));

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500">Real-time overview of company food bill expenses and verifications</p>
        </div>
        <div className="flex items-center gap-2 bg-primary-50 text-primary-900 px-4 py-2 rounded-xl border border-primary-200 text-xs font-semibold">
          <Calendar className="h-4 w-4" />
          <span>Current Period: <b>{getCurrentPeriodStr()}</b></span>
        </div>
      </div>

      {/* Metric Cards (7 cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-1">
            <Receipt className="h-3.5 w-3.5 text-primary-900" />
            <span>Total Bills</span>
          </div>
          <span className="text-xl font-black text-slate-900">{summary.totalBills}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-1">
            <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
            <span>Total Amount</span>
          </div>
          <span className="text-xl font-black text-emerald-600">₹{summary.totalAmount.toLocaleString('en-IN')}</span>
        </div>

        <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 shadow-xs">
          <div className="flex items-center gap-1.5 text-amber-700 text-[11px] font-semibold uppercase tracking-wider mb-1">
            <Clock className="h-3.5 w-3.5" />
            <span>Pending</span>
          </div>
          <span className="text-xl font-black text-amber-700">{summary.pendingCount}</span>
        </div>

        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-semibold uppercase tracking-wider mb-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Approved</span>
          </div>
          <span className="text-xl font-black text-emerald-700">{summary.approvedCount}</span>
        </div>

        <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-200 shadow-xs">
          <div className="flex items-center gap-1.5 text-rose-700 text-[11px] font-semibold uppercase tracking-wider mb-1">
            <XCircle className="h-3.5 w-3.5" />
            <span>Rejected</span>
          </div>
          <span className="text-xl font-black text-rose-700">{summary.rejectedCount}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-1">
            <Users className="h-3.5 w-3.5 text-blue-600" />
            <span>Total Agents</span>
          </div>
          <span className="text-xl font-black text-slate-900">{agents.length}</span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-primary-900 to-slate-900 p-4 rounded-2xl text-white shadow-md">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-300 block mb-1">Active Cycle</span>
          <span className="text-sm font-bold block">15-Day Report</span>
          <span className="text-[10px] text-emerald-400 font-medium">Ready for Excel/PDF</span>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Food Expenses by Agent */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary-900" />
            Food Expenses by Agent (₹)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Total Expense']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="Amount" fill="#1E3A8A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Food Expenses by Day */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-600" />
            Daily Expense Trend (₹)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dayChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Amount']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}
                />
                <Line type="monotone" dataKey="Amount" stroke="#059669" strokeWidth={2.5} dot={{ r: 4, fill: '#059669' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
