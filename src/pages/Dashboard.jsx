import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, Clock, Building2, Briefcase,
  IndianRupee, Activity, XCircle, AlertCircle, TrendingUp,
  TrendingDown, Wallet, ArrowRight, Receipt, RefreshCw, FileBox,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

function Pulse({ h = 'h-4', w = 'w-full', rounded = 'rounded-lg' }) {
  return <div className={`${h} ${w} ${rounded} bg-slate-200 dark:bg-slate-700 animate-pulse`} />;
}

function StatCard({ label, value, sub, icon: Icon, iconBg, loading, onClick }) {
  if (loading) {
    return (
      <div className="rounded-md border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between">
          <Pulse h="h-3" w="w-24" />
          <Pulse h="h-9" w="w-9" rounded="rounded-md" />
        </div>
        <Pulse h="h-7" w="w-28" />
        <Pulse h="h-3" w="w-36" />
      </div>
    );
  }
  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-md border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex flex-col gap-3 shadow-sm transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300 dark:hover:border-gray-600' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</span>
        <span className={`w-9 h-9 rounded-md flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${iconBg}`}>
          <Icon size={16} />
        </span>
      </div>
      <div>
        <p className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-0.5">{value}</p>
        {sub && <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{sub}</p>}
      </div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, iconColor, iconBg, action, actionLabel, children, loading, loadingRows = 3 }) {
  return (
    <div className="rounded-md border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-gray-700 bg-slate-50/60 dark:bg-gray-900/40">
        <span className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
          <div className={`w-7 h-7 rounded-md flex items-center justify-center ${iconBg || 'bg-slate-100 dark:bg-slate-800'} ${iconColor}`}>
            <Icon size={14} className="stroke-[2.5]" />
          </div>
          {title}
        </span>
        {action && (
          <button
            onClick={action}
            className="group flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-100 dark:border-blue-900"
          >
            {actionLabel}
            <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>
      {loading ? (
        <div className="p-4 flex flex-col gap-3">
          {[...Array(loadingRows)].map((_, i) => <Pulse key={i} h="h-9" rounded="rounded-md" />)}
        </div>
      ) : (
        <div className="flex-1 flex flex-col">{children}</div>
      )}
    </div>
  );
}

function BreakdownRow({ label, value, total, icon: Icon, badgeClass, textClass }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-gray-700 last:border-0 hover:bg-slate-50 dark:hover:bg-gray-700/40 transition-colors">
      <div className={`w-7 h-7 rounded-md flex items-center justify-center bg-white dark:bg-gray-800 shadow-sm border border-slate-100 dark:border-gray-700 ${textClass}`}>
        <Icon size={13} className="stroke-[2.5]" />
      </div>
      <span className="text-sm font-semibold flex-1 text-slate-700 dark:text-slate-200">{label}</span>
      <div className="flex items-center gap-2">
        {total > 0 && (
          <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-gray-700 overflow-hidden hidden sm:block">
            <div className={`h-full rounded-full transition-all duration-700 ${badgeClass.split(' ')[0]}`} style={{ width: `${pct}%` }} />
          </div>
        )}
        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold min-w-[28px] text-center ${badgeClass}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

function BalanceRow({ label, amount, icon: Icon, iconClass }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-gray-700 last:border-0 hover:bg-slate-50 dark:hover:bg-gray-700/40 transition-colors">
      <span className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
        <div className={`w-7 h-7 rounded-md flex items-center justify-center bg-white dark:bg-gray-800 shadow-sm border border-slate-100 dark:border-gray-700 ${iconClass}`}>
          <Icon size={13} className="stroke-[2.5]" />
        </div>
        {label}
      </span>
      <span className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-0.5">
        <IndianRupee size={13} className="text-slate-400 dark:text-slate-500" />{fmt(amount)}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashData, setDashData] = useState(null);

  const fetchDashboard = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setIsLoading(true);
    try {
      const res = await apiCall('/report/dashboard', 'GET');
      const json = await res.json();
      if (res.ok && json.success !== false) {
        setDashData(json.data);
      } else {
        toast.error(json.message || 'Failed to load dashboard');
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      toast.error('Failed to load dashboard');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const tasks = dashData?.tasks || {};
  const firms = dashData?.firms || {};
  const balance = dashData?.balance || {};

  const topStats = [
    {
      label: 'Net Balance',
      value: `₹${fmt(balance.balance)}`,
      sub: `Credit ₹${fmt(balance.credit)}  ·  Debit ₹${fmt(balance.debit)}`,
      icon: Wallet,
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
      onClick: () => navigate('/ledger'),
    },
    {
      label: 'Total Tasks',
      value: tasks.total ?? '—',
      sub: `${tasks.in_process ?? 0} in process  ·  ${tasks.complete ?? 0} complete`,
      icon: Briefcase,
      iconBg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      onClick: () => navigate('/tasks'),
    },
    {
      label: 'Active Firms',
      value: firms.active ?? '—',
      sub: `${firms.total ?? 0} total  ·  ${firms.inactive ?? 0} inactive`,
      icon: Building2,
      iconBg: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
      onClick: () => navigate('/firms'),
    },
    {
      label: 'Cancelled',
      value: tasks.cancel ?? '—',
      sub: (tasks.cancel ?? 0) === 0 ? 'No cancellations' : 'Review cancelled tasks',
      icon: XCircle,
      iconBg: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
      onClick: () => navigate('/tasks'),
    },
  ];

  const taskBreakdown = [
    { label: 'In Process', value: tasks.in_process ?? 0, icon: Activity, textClass: 'text-blue-600 dark:text-blue-400', badgeClass: 'bg-blue-500 text-white' },
    { label: 'Pending from Client', value: tasks.pending_from_client ?? 0, icon: Clock, textClass: 'text-amber-600 dark:text-amber-400', badgeClass: 'bg-amber-500 text-white' },
    { label: 'Pending from Dept', value: tasks.pending_from_department ?? 0, icon: AlertCircle, textClass: 'text-orange-600 dark:text-orange-400', badgeClass: 'bg-orange-500 text-white' },
    { label: 'Completed', value: tasks.complete ?? 0, icon: CheckCircle, textClass: 'text-emerald-600 dark:text-emerald-400', badgeClass: 'bg-emerald-500 text-white' },
    { label: 'Cancelled', value: tasks.cancel ?? 0, icon: XCircle, textClass: 'text-rose-600 dark:text-rose-400', badgeClass: 'bg-rose-500 text-white' },
  ];

  return (
    <div className="flex flex-col gap-2 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-2">
        <div className="flex flex-col">
          {userData?.name ? (
            <>
              <h1 className="text-lg md:text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">{userData.name}</span>
              </h1>
              {userData?.branch?.name && (
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                  <Building2 size={14} className="text-slate-400" />
                  {userData.branch.name}
                </p>
              )}
            </>
          ) : (
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Overview of your workspace
            </h1>
          )}
        </div>
        <button
          onClick={() => fetchDashboard(true)}
          disabled={isLoading || refreshing}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 shadow-sm"
        >
          <RefreshCw size={13} className={(isLoading || refreshing) ? 'animate-spin text-blue-500' : ''} />
          Refresh
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {topStats.map((s) => (
            <StatCard key={s.label} {...s} loading={isLoading} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <SectionCard
            title="Task Breakdown"
            icon={Briefcase}
            iconColor="text-blue-600 dark:text-blue-400"
            iconBg="bg-blue-100 dark:bg-blue-900/30"
            action={() => navigate('/tasks')}
            actionLabel="View all"
            loading={isLoading}
            loadingRows={5}
          >
            {(tasks.total ?? 0) > 0 && (
              <div className="px-4 pt-3 pb-2">
                <div className="flex rounded-full overflow-hidden h-1.5 bg-slate-100 dark:bg-gray-700 gap-px">
                  {[
                    { val: tasks.in_process, color: 'bg-blue-500' },
                    { val: tasks.pending_from_client, color: 'bg-amber-500' },
                    { val: tasks.pending_from_department, color: 'bg-orange-500' },
                    { val: tasks.complete, color: 'bg-emerald-500' },
                    { val: tasks.cancel, color: 'bg-rose-500' },
                  ].map(({ val, color }, i) => {
                    const pct = ((val || 0) / tasks.total) * 100;
                    return pct > 0 ? (
                      <div key={i} className={`${color}`} style={{ width: `${pct}%` }} />
                    ) : null;
                  })}
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{tasks.total} total tasks</p>
              </div>
            )}
            <div>
              {taskBreakdown.map((item) => (
                <BreakdownRow key={item.label} {...item} total={tasks.total ?? 0} />
              ))}
            </div>
          </SectionCard>

          <div className="flex flex-col gap-3">
            <SectionCard
              title="Balance Overview"
              icon={Wallet}
              iconColor="text-emerald-600 dark:text-emerald-400"
              iconBg="bg-emerald-100 dark:bg-emerald-900/30"
              action={() => navigate('/ledger')}
              actionLabel="Ledger"
              loading={isLoading}
              loadingRows={3}
            >
              <div className="px-4 py-3 border-b border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/20">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Net Balance</p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-0.5 tracking-tight">
                  <IndianRupee size={18} className="text-slate-400 dark:text-slate-500 stroke-[2.5]" />
                  {fmt(balance.balance)}
                </p>
              </div>
              <div>
                <BalanceRow label="Credit" amount={balance.credit} icon={TrendingUp} iconClass="text-emerald-500" />
                <BalanceRow label="Debit" amount={balance.debit} icon={TrendingDown} iconClass="text-rose-500" />
              </div>
            </SectionCard>

            <SectionCard
              title="Firms"
              icon={Building2}
              iconColor="text-indigo-600 dark:text-indigo-400"
              iconBg="bg-indigo-100 dark:bg-indigo-900/30"
              action={() => navigate('/firms')}
              actionLabel="View all"
              loading={isLoading}
              loadingRows={2}
            >
              <div>
                {[
                  { label: 'Active Firms', value: firms.active ?? 0, icon: CheckCircle, iconClass: 'text-emerald-500', badge: 'bg-emerald-500 text-white' },
                  { label: 'Inactive Firms', value: firms.inactive ?? 0, icon: XCircle, iconClass: 'text-slate-400', badge: 'bg-slate-400 text-white' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-gray-700 last:border-0 hover:bg-slate-50 dark:hover:bg-gray-700/40 transition-colors">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center bg-white dark:bg-gray-800 shadow-sm border border-slate-100 dark:border-gray-700 ${item.iconClass}`}>
                      <item.icon size={13} className="stroke-[2.5]" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex-1">{item.label}</span>
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${item.badge}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Quick Links</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Tasks', path: '/tasks', icon: Briefcase, iconBg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400', desc: 'Manage assigned tasks' },
              { label: 'Firms', path: '/firms', icon: Building2, iconBg: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400', desc: 'Client firm accounts' },
              { label: 'Ledger', path: '/ledger', icon: Receipt, iconBg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', desc: 'Sales, payments & journals' },
              { label: 'Documents', path: '/documents', icon: FileBox, iconBg: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400', desc: 'GST, IT & MCA filings' },
            ].map(({ label, path, icon: Icon, iconBg, desc }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="group relative flex items-center gap-4 p-4 rounded-md border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md hover:border-slate-300 dark:hover:border-gray-600 transition-all duration-200 text-left overflow-hidden shadow-sm"
              >
                <span className={`w-11 h-11 rounded-md flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 ${iconBg}`}>
                  <Icon size={20} className="stroke-[2]" />
                </span>
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">{label}</span>
                  <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{desc}</span>
                </div>
                <div className="w-8 h-8 rounded-md bg-slate-50 dark:bg-gray-700/50 flex items-center justify-center group-hover:bg-slate-100 dark:group-hover:bg-gray-700 transition-colors shadow-sm shrink-0">
                  <ArrowRight size={14} className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
