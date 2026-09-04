import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare, Clock, Eye, Activity, User, Building2, Shield,
} from 'lucide-react';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';
import ManagementHub from '../components/common/ManagementHub';
import ManagementFilters from '../components/common/ManagementFilters';
import ManagementCard from '../components/common/ManagementCard';
import ManagementTable from '../components/common/ManagementTable';
import TablePagination from '../components/TablePagination';
import { formatDate } from '../utils/helpers';

const STATUS_MAP = {
  'in process': { label: 'In Process', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800' },
  'complete': { label: 'Complete', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' },
  'pending from department': { label: 'Dept. Pending', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800' },
  'pending from client': { label: 'Client Pending', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800' },
  'cancel': { label: 'Cancelled', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800' },
};

const CA_APPROVAL_MAP = {
  pending: { label: 'Pending', badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700' },
  sent: { label: 'Sent', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800' },
  complete: { label: 'Complete', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' },
};

const getStatus = (s) => {
  const key = (s || '').toLowerCase().trim();
  return STATUS_MAP[key] || { label: s || 'Unknown', badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700' };
};

const getCaApproval = (s) => {
  const key = (s || 'pending').toLowerCase().trim();
  return CA_APPROVAL_MAP[key] || { label: s || 'Pending', badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700' };
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'in process', label: 'In Process' },
  { value: 'pending from department', label: 'Dept. Pending' },
  { value: 'pending from client', label: 'Client Pending' },
  { value: 'complete', label: 'Complete' },
  { value: 'cancel', label: 'Cancelled' },
];

const CA_APPROVAL_OPTIONS = [
  { value: 'all', label: 'All CA Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'sent', label: 'Sent' },
  { value: 'complete', label: 'Complete' },
];

function Pulse({ h = 'h-4', w = 'w-full', rounded = 'rounded' }) {
  return <div className={`${h} ${w} ${rounded} bg-slate-200 dark:bg-slate-700 animate-pulse`} />;
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-sm border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100/80 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/40">
              {['Service / Client', 'Firm', 'Status', 'CA Status', 'Due Date'].map((h) => (
                <th key={h} className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80 dark:divide-slate-700/40">
            {[...Array(6)].map((_, i) => (
              <tr key={i}>
                {[...Array(5)].map((_, j) => (
                  <td key={j} className="px-6 py-4">
                    <Pulse h="h-4" w={j === 0 ? 'w-36' : 'w-24'} rounded="rounded-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-sm border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-5 flex flex-col gap-4 shadow-sm">
          <Pulse h="h-5" w="w-3/4" rounded="rounded-full" />
          <Pulse h="h-4" w="w-1/2" rounded="rounded-full" />
        </div>
      ))}
    </div>
  );
}

function TaskCard({ task, onClick }) {
  const { label, badge } = getStatus(task.status);
  const ca = getCaApproval(task.ca_approval);
  return (
    <ManagementCard
      title={task.service?.name || '—'}
      subtitle={
        <span className="flex items-center gap-1.5 mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <User size={10} className="shrink-0" />
          <span className="truncate">{task.client?.name || '—'}</span>
        </span>
      }
      icon={<Activity size={14} />}
      badge={
        <div className="flex flex-col items-end gap-1">
          <div className="flex flex-wrap items-center justify-end gap-1">
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest shrink-0 shadow-sm ${badge}`}>
              {label}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest shrink-0 shadow-sm ${ca.badge}`}>
              CA: {ca.label}
            </span>
          </div>
          {String(task.ca_approval || '').toLowerCase() === 'complete' && task.udin ? (
            <p className="max-w-[160px] truncate text-[10px] font-semibold text-emerald-700 dark:text-emerald-400" title={task.udin}>
              UDIN: {task.udin}
            </p>
          ) : null}
        </div>
      }
      onClick={onClick}
      accent="blue"
      menuId={`task-${task.task_id}`}
      actions={[{ id: 'view', label: 'Open Profile', icon: <Eye size={14} />, onClick }]}
      footer={
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-800 px-2 py-1 rounded-lg">
          <Clock size={12} className={task.dates?.due_date ? 'text-amber-500' : ''} />
          {formatDate(task.dates?.due_date)}
        </div>
      }
    >
      <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 mb-2 mt-2 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50">
        <Building2 size={12} className="shrink-0 text-slate-400" />
        <span className="truncate font-semibold">{task.firm?.firm_name || '—'}</span>
      </div>
    </ManagementCard>
  );
}

export default function Task({ fixedCaApproval = null } = {}) {
  const navigate = useNavigate();
  const isSentApprovalsPage = fixedCaApproval === 'sent';
  const [viewMode, setViewMode] = useState(() => window.innerWidth < 768 ? 'card' : 'table');
  useEffect(() => {
    const h = () => setViewMode(window.innerWidth < 768 ? 'card' : 'table');
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [caApproval, setCaApproval] = useState(fixedCaApproval || 'all');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (fixedCaApproval) {
      setCaApproval(fixedCaApproval);
      setPage(1);
    }
  }, [fixedCaApproval]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page_no: page, limit, search });
      if (status && status !== 'all') {
        qs.append('status', status);
      }
      const approvalFilter = fixedCaApproval || caApproval;
      if (approvalFilter && approvalFilter !== 'all') {
        qs.append('ca_approval', approvalFilter);
      }

      const res = await apiCall(`/task/list?${qs}`, 'GET');
      const data = await res.json();
      if (res.ok && data.success !== false) {
        setTasks(data.data || []);
        setTotal(data.pagination?.total ?? data.meta?.total ?? 0);
      } else {
        setTasks([]);
        setTotal(0);
        toast.error(data.message || 'Failed to load tasks');
      }
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status, caApproval, fixedCaApproval]);

  useEffect(() => {
    const t = setTimeout(fetchTasks, 300);
    return () => clearTimeout(t);
  }, [fetchTasks]);

  const openProfile = (task) => {
    if (!task?.task_id) return;
    navigate(
      isSentApprovalsPage
        ? `/tasks/${task.task_id}/udin`
        : `/tasks/${task.task_id}/basic`
    );
  };

  const statusOptions = STATUS_OPTIONS.map(o => ({ value: o.value, label: o.label }));
  const caApprovalOptions = CA_APPROVAL_OPTIONS.map(o => ({ value: o.value, label: o.label }));

  const tableColumns = [
    {
      key: 'service',
      label: 'Service / Client',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white leading-snug">{row.service?.name || '—'}</p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <User size={12} className="text-slate-400" /> {row.client?.name || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'firm',
      label: 'Firm',
      render: (row) => (
        <p className="font-bold text-slate-800 dark:text-slate-200 leading-snug flex items-center gap-1.5">
          <Building2 size={12} className="text-slate-400" /> {row.firm?.firm_name || '—'}
        </p>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const { label, badge } = getStatus(row.status);
        return (
          <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold whitespace-nowrap shadow-sm ${badge}`}>
            {label}
          </span>
        );
      },
    },
    ...(!isSentApprovalsPage
      ? [{
          key: 'ca_approval',
          label: 'CA Status',
          render: (row) => {
            const { label, badge } = getCaApproval(row.ca_approval);
            const isComplete = String(row.ca_approval || '').toLowerCase() === 'complete';
            const udin = String(row.udin || '').trim();
            return (
              <div className="flex flex-col items-start gap-1">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold whitespace-nowrap shadow-sm ${badge}`}>
                  <Shield size={10} />
                  {label}
                </span>
                {isComplete && udin ? (
                  <p className="max-w-[180px] truncate text-[11px] font-semibold text-emerald-700 dark:text-emerald-400" title={udin}>
                    UDIN: {udin}
                  </p>
                ) : null}
              </div>
            );
          },
        }]
      : []),
    {
      key: 'due_date',
      label: 'Due Date',
      render: (row) => (
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
          <Clock size={12} className={row.dates?.due_date ? 'text-amber-500' : ''} /> {formatDate(row.dates?.due_date)}
        </span>
      ),
    },
  ];

  const getTableActions = (row) => [
    {
      id: 'view',
      label: isSentApprovalsPage ? 'Open UDIN' : 'Open Profile',
      icon: <Eye size={14} />,
      onClick: () => openProfile(row),
    },
  ];

  const filterDefs = [
    {
      options: statusOptions,
      value: statusOptions.find(o => o.value === status) || statusOptions[0],
      onChange: (selected) => { setStatus(selected ? selected.value : 'all'); setPage(1); },
      placeholder: 'Filter Status',
      isClearable: false,
    },
  ];
  if (!isSentApprovalsPage) {
    filterDefs.push({
      options: caApprovalOptions,
      value: caApprovalOptions.find(o => o.value === caApproval) || caApprovalOptions[0],
      onChange: (selected) => { setCaApproval(selected ? selected.value : 'all'); setPage(1); },
      placeholder: 'Filter CA Status',
      isClearable: false,
    });
  }

  return (
    <ManagementHub
      title={isSentApprovalsPage ? 'Sent Approvals' : 'Tasks'}
      description={
        isSentApprovalsPage
          ? 'Tasks sent for CA approval — add UDIN and complete them here.'
          : 'Track and manage your assigned client tasks.'
      }
      accent={isSentApprovalsPage ? 'amber' : 'blue'}
      onRefresh={fetchTasks}
      refreshing={loading}
      refreshLabel="Refresh"
    >
      <div className="space-y-4">
        <ManagementFilters
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchValue={search}
          onSearchChange={(val) => { setSearch(val); setPage(1); }}
          searchPlaceholder="Search service, client, firm…"
          filters={filterDefs}
        />

        {loading ? (
          viewMode === 'table' ? <TableSkeleton /> : <CardSkeleton />
        ) : tasks.length === 0 ? (
          <div className="rounded-sm border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-16 text-center flex flex-col items-center gap-4 shadow-sm">
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
              <CheckSquare size={48} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-bold">
              {isSentApprovalsPage ? 'No sent approval tasks' : 'No tasks found'}
            </p>
            <p className="text-slate-500 dark:text-slate-500 text-sm font-medium">
              {isSentApprovalsPage
                ? 'When a branch sets CA approval to Sent, those tasks will appear here'
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        ) : viewMode === 'table' ? (
          <ManagementTable
            rows={tasks}
            columns={tableColumns}
            rowKey="task_id"
            getActions={getTableActions}
            onRowClick={(row) => openProfile(row)}
            accent={isSentApprovalsPage ? 'amber' : 'blue'}
            showSerialNo={true}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tasks.map((task) => (
              <TaskCard key={task.task_id} task={task} onClick={() => openProfile(task)} />
            ))}
          </div>
        )}

        <TablePagination
          page={page}
          limit={limit}
          total={total}
          totalPages={Math.max(1, Math.ceil(total / limit) || 1)}
          rowOptions={[5, 10, 20, 50, 100]}
          defaultRows={20}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
        />
      </div>
    </ManagementHub>
  );
}
