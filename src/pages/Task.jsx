import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare, Clock, Eye, User, Building2, Shield,
} from 'lucide-react';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';
import ManagementHub from '../components/common/ManagementHub';
import ManagementFilters from '../components/common/ManagementFilters';
import ManagementTable from '../components/common/ManagementTable';
import TablePagination from '../components/TablePagination';
import { formatDate } from '../utils/helpers';
import {
  FREQUENCY_OPTIONS,
  getComplianceYearOptions,
  getPeriodOptions,
  normalizeFrequency,
} from '../utils/compliancePeriod';

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

/** Default: in-process only (exclude complete + cancel), matching CLIENT task list. */
const DEFAULT_SELECTED_STATUSES = [
  'in process',
  'pending from client',
  'pending from department',
];

const STATUS_OPTIONS = [
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

const FREQUENCY_SELECT_OPTIONS = [
  { value: '', label: 'All frequencies' },
  ...FREQUENCY_OPTIONS,
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

async function fetchAddedServices() {
  const collected = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const res = await apiCall(
      `/service/list?page_no=${page}&limit=100&added_only=true&search=`,
      'GET'
    );
    const data = await res.json();
    if (!res.ok || data.success === false) break;
    collected.push(...(data.data || []));
    hasMore = data.pagination?.is_last_page === false;
    page += 1;
  }

  return collected
    .filter((service) => service.is_added !== false)
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
}

export default function Task({ fixedCaApproval = null } = {}) {
  const navigate = useNavigate();
  const isSentApprovalsPage = fixedCaApproval === 'sent';

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState(DEFAULT_SELECTED_STATUSES);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [frequency, setFrequency] = useState('');
  const [complianceYear, setComplianceYear] = useState('');
  const [compliancePeriod, setCompliancePeriod] = useState('');
  const [caApproval, setCaApproval] = useState(fixedCaApproval || 'all');
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (fixedCaApproval) {
      setCaApproval(fixedCaApproval);
      setPage(1);
    }
  }, [fixedCaApproval]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setServicesLoading(true);
      try {
        const list = await fetchAddedServices();
        if (!cancelled) setServices(list);
      } catch {
        if (!cancelled) setServices([]);
      } finally {
        if (!cancelled) setServicesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const selectedServices = useMemo(
    () => services.filter((s) => selectedServiceIds.includes(String(s.service_id))),
    [services, selectedServiceIds]
  );

  const selectedComplianceServices = useMemo(
    () => selectedServices.filter(
      (s) => String(s.type || '').toLowerCase() === 'compliance'
    ),
    [selectedServices]
  );

  const periodSourceFrequency = useMemo(() => {
    if (frequency) return normalizeFrequency(frequency);
    if (selectedComplianceServices.length === 1) {
      return normalizeFrequency(selectedComplianceServices[0].frequency);
    }
    return '';
  }, [frequency, selectedComplianceServices]);

  const periodChoices = useMemo(() => {
    if (!periodSourceFrequency) return [];
    if (periodSourceFrequency === 'yearly') return [];
    return getPeriodOptions(periodSourceFrequency);
  }, [periodSourceFrequency]);

  const periodFilterEnabled = Boolean(
    complianceYear && periodSourceFrequency && periodSourceFrequency !== 'yearly'
  );

  useEffect(() => {
    setCompliancePeriod('');
  }, [complianceYear, periodSourceFrequency]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page_no: page, limit, search });
      selectedStatuses.forEach((status) => qs.append('status', status));
      selectedServiceIds.forEach((id) => qs.append('service_ids', id));
      if (frequency) qs.append('frequency', frequency);
      if (complianceYear) qs.append('compliance_year', complianceYear);
      if (compliancePeriod && periodFilterEnabled) {
        qs.append('compliance_period', compliancePeriod);
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
  }, [
    page,
    limit,
    search,
    selectedStatuses,
    selectedServiceIds,
    frequency,
    complianceYear,
    compliancePeriod,
    periodFilterEnabled,
    caApproval,
    fixedCaApproval,
  ]);

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

  const statusOptions = STATUS_OPTIONS;
  const caApprovalOptions = CA_APPROVAL_OPTIONS;
  const serviceOptions = useMemo(
    () => services.map((service) => ({
      value: String(service.service_id),
      label: service.name || 'Unnamed service',
    })),
    [services]
  );
  const yearOptions = useMemo(
    () => [
      { value: '', label: 'All years' },
      ...getComplianceYearOptions(5).map((year) => ({ value: year, label: year })),
    ],
    []
  );
  const periodSelectOptions = useMemo(
    () => periodChoices.map((period) => ({ value: period, label: period })),
    [periodChoices]
  );

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
      key: 'status',
      options: statusOptions,
      value: statusOptions.filter((o) => selectedStatuses.includes(o.value)),
      onChange: (selected) => {
        const next = Array.isArray(selected)
          ? selected.map((o) => o.value)
          : [];
        setSelectedStatuses(next);
        setPage(1);
      },
      placeholder: 'Status',
      isMulti: true,
      compactMulti: true,
      isClearable: true,
    },
    {
      key: 'service',
      options: serviceOptions,
      value: serviceOptions.filter((o) => selectedServiceIds.includes(o.value)),
      onChange: (selected) => {
        const next = Array.isArray(selected)
          ? selected.map((o) => o.value)
          : [];
        setSelectedServiceIds(next);
        setPage(1);
      },
      placeholder: servicesLoading ? 'Loading services…' : 'Services (added)',
      isMulti: true,
      isClearable: true,
      isDisabled: servicesLoading,
    },
    {
      key: 'frequency',
      options: FREQUENCY_SELECT_OPTIONS,
      value: FREQUENCY_SELECT_OPTIONS.find((o) => o.value === frequency) || FREQUENCY_SELECT_OPTIONS[0],
      onChange: (selected) => {
        setFrequency(selected?.value || '');
        setCompliancePeriod('');
        setPage(1);
      },
      placeholder: 'Frequency',
      isClearable: false,
    },
    {
      key: 'year',
      options: yearOptions,
      value: yearOptions.find((o) => o.value === complianceYear) || yearOptions[0],
      onChange: (selected) => {
        setComplianceYear(selected?.value || '');
        setCompliancePeriod('');
        setPage(1);
      },
      placeholder: 'Financial year',
      isClearable: false,
    },
    {
      key: 'period',
      options: periodSelectOptions,
      value: periodSelectOptions.find((o) => o.value === compliancePeriod) || null,
      onChange: (selected) => {
        setCompliancePeriod(selected?.value || '');
        setPage(1);
      },
      placeholder: !periodSourceFrequency
        ? 'Select frequency or 1 service'
        : !complianceYear
          ? 'Select year first'
          : periodSourceFrequency === 'yearly'
            ? 'Annual (no period)'
            : 'Period',
      isClearable: true,
      isDisabled: !periodFilterEnabled,
    },
  ];
  if (!isSentApprovalsPage) {
    filterDefs.push({
      key: 'ca_approval',
      options: caApprovalOptions,
      value: caApprovalOptions.find((o) => o.value === caApproval) || caApprovalOptions[0],
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
          searchValue={search}
          onSearchChange={(val) => { setSearch(val); setPage(1); }}
          searchPlaceholder="Search service, client, firm…"
          filters={filterDefs}
        />

        {loading ? (
          <TableSkeleton />
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
        ) : (
          <ManagementTable
            rows={tasks}
            columns={tableColumns}
            rowKey="task_id"
            getActions={getTableActions}
            onRowClick={(row) => openProfile(row)}
            accent={isSentApprovalsPage ? 'amber' : 'blue'}
            showSerialNo={true}
          />
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
