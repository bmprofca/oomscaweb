import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  Building2,
  User,
  FileText,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiCall } from '../utils/apiCall';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import TablePagination from '../components/TablePagination';
import { formatDate } from '../utils/helpers';

const TABS = [
  { id: 'pending', label: 'Pending', status: 0 },
  { id: 'complete', label: 'Complete', status: 1 },
];

const formatInr = (amount) => {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '—';
  return `₹${n.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

async function downloadFromUrl(fileUrl, suggestedName) {
  try {
    const fileRes = await fetch(fileUrl);
    const blob = await fileRes.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = suggestedName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.target = '_blank';
    link.download = suggestedName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function TableSkeleton({ columns = 4 }) {
  return (
    <div className="overflow-hidden rounded-sm border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 shadow-sm">
      <div className="animate-pulse divide-y divide-slate-100 dark:divide-slate-700/40">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="grid gap-4 px-6 py-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {[...Array(columns)].map((_, j) => (
              <div key={j} className="h-4 rounded-full bg-slate-200 dark:bg-slate-700" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Billing() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  const statusFilter = TABS.find((t) => t.id === activeTab)?.status ?? 0;
  const isCompleteTab = activeTab === 'complete';

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page_no: String(page),
        limit: String(limit),
        status: String(statusFilter),
        search: search.trim(),
      });
      const res = await apiCall(`/billing/list?${qs}`, 'GET');
      const data = await res.json();
      if (res.ok && data.success !== false) {
        setRows(data.data || []);
        setTotal(data.pagination?.total ?? 0);
      } else {
        setRows([]);
        setTotal(0);
        toast.error(data.message || 'Failed to load billing');
      }
    } catch {
      setRows([]);
      setTotal(0);
      toast.error('Failed to load billing');
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, search]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(fetchList, search.trim() ? 250 : 0);
    return () => clearTimeout(t);
  }, [fetchList, search]);

  const handleTabChange = (tabId) => {
    if (tabId === activeTab) return;
    setLoading(true);
    setRows([]);
    setTotal(0);
    setActiveTab(tabId);
    setPage(1);
  };

  const downloadInvoice = async (row) => {
    const invoiceId = row?.purchase_invoice_id;
    if (!invoiceId) {
      toast.error('Invoice not available for this purchase');
      return;
    }
    setDownloadingId(row.task_id);
    const toastId = toast.loading('Generating purchase invoice…');
    try {
      const response = await apiCall('/transaction/generate-invoice', 'POST', {
        invoice_id: invoiceId,
        type: 'purchase',
      });
      const resData = await response.json();
      if (response.ok && resData.success && resData.data?.url) {
        toast.success(resData.message || 'Invoice ready', { id: toastId });
        await downloadFromUrl(
          resData.data.url,
          resData.data.suggested_filename || resData.data.filename || 'purchase-invoice.pdf'
        );
      } else {
        toast.error(resData.message || 'Failed to download invoice', { id: toastId });
      }
    } catch (error) {
      toast.error(error.message || 'Failed to download invoice', { id: toastId });
    } finally {
      setDownloadingId(null);
    }
  };

  const columns = [
    {
      key: 'service',
      label: 'Service / Task',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white leading-snug">
            {row.service?.name || '—'}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            {row.task_id}
          </p>
          {(row.compliance_year || row.compliance_period) && (
            <p className="mt-0.5 text-[11px] text-slate-400">
              {[row.compliance_year, row.compliance_period].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'firm',
      label: 'Firm',
      render: (row) => (
        <div>
          <p className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
            <Building2 size={12} className="text-slate-400 shrink-0" />
            {row.firm?.firm_name || '—'}
          </p>
          {row.firm?.pan_no && (
            <p className="mt-0.5 text-xs text-slate-500">PAN: {row.firm.pan_no}</p>
          )}
        </div>
      ),
    },
    {
      key: 'client',
      label: 'Client',
      render: (row) => (
        <p className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
          <User size={12} className="text-slate-400 shrink-0" />
          {row.client?.name || '—'}
        </p>
      ),
    },
    ...(isCompleteTab
      ? [
          {
            key: 'amount',
            label: 'Purchase amount',
            render: (row) => (
              <div>
                <p className="font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                  {formatInr(row.purchase_amount)}
                </p>
                {row.purchase_invoice_no && (
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    Inv: {row.purchase_invoice_no}
                  </p>
                )}
              </div>
            ),
          },
          {
            key: 'purchase_date',
            label: 'Purchase date',
            render: (row) => (
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {formatDate(row.purchase_date)}
              </p>
            ),
          },
        ]
      : []),
    {
      key: 'billing_status',
      label: 'Status',
      render: () =>
        isCompleteTab ? (
          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
            Complete
          </span>
        ) : (
          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            Pending
          </span>
        ),
    },
  ];

  const getActions = (row) => {
    if (!isCompleteTab) return [];
    return [
      {
        id: 'download',
        label: downloadingId === row.task_id ? 'Downloading…' : 'Download invoice',
        icon: <Download size={14} />,
        disabled: !row.purchase_invoice_id || downloadingId === row.task_id,
        onClick: () => downloadInvoice(row),
      },
    ];
  };

  return (
    <ManagementHub
      title="Purchase Billing"
      description="Completed tasks awaiting purchase billing, and generated purchase invoices."
      accent="emerald"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onRefresh={fetchList}
      refreshing={loading}
      refreshLabel="Refresh"
    >
      <div className="space-y-4">
        <div className="rounded-md border border-slate-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 p-2 sm:p-3 shadow-sm">
          <div className="relative max-w-sm">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setLoading(true);
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search service, firm, PAN, client, task…"
              className="w-full rounded-md border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 py-2 pl-9 pr-3 text-sm text-slate-800 dark:text-gray-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {loading ? (
          <TableSkeleton columns={isCompleteTab ? 6 : 4} />
        ) : rows.length === 0 ? (
          <div className="rounded-sm border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 p-16 text-center flex flex-col items-center gap-4 shadow-sm">
            <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-4">
              <FileText size={40} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-lg font-bold text-slate-600 dark:text-slate-400">
              {isCompleteTab ? 'No completed purchases' : 'No pending purchase billing'}
            </p>
            <p className="text-sm font-medium text-slate-500">
              {isCompleteTab
                ? 'Generated purchase invoices for your completed tasks will appear here'
                : 'Only completed tasks that are not yet billed appear under Pending'}
            </p>
          </div>
        ) : (
          <ManagementTable
            rows={rows}
            columns={columns}
            rowKey="task_id"
            getActions={isCompleteTab ? getActions : undefined}
            onRowClick={(row) => navigate(`/tasks/${row.task_id}/basic`)}
            accent="emerald"
            showSerialNo
          />
        )}

        <TablePagination
          page={page}
          limit={limit}
          total={total}
          totalPages={Math.max(1, Math.ceil(total / limit) || 1)}
          rowOptions={[5, 10, 20, 50, 100]}
          defaultRows={20}
          onPageChange={(p) => {
            setLoading(true);
            setPage(p);
          }}
          onLimitChange={(l) => {
            setLoading(true);
            setLimit(l);
            setPage(1);
          }}
        />
      </div>
    </ManagementHub>
  );
}
