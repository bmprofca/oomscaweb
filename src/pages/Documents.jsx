import React, { useState, useEffect, useCallback } from 'react';
import {
  FileBox, ExternalLink, Building2, User, Search,
  Receipt, FileText, Users, Folder,
} from 'lucide-react';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import TablePagination from '../components/TablePagination';
import { formatDate } from '../utils/helpers';

const TABS = [
  { id: 'gst', label: 'GST', icon: Receipt },
  { id: 'it', label: 'IT', icon: FileText },
  { id: 'mca', label: 'MCA', icon: Users },
  { id: 'general', label: 'General', icon: Folder },
];

function Pulse({ h = 'h-4', w = 'w-full', rounded = 'rounded' }) {
  return <div className={`${h} ${w} ${rounded} bg-slate-200 dark:bg-slate-700 animate-pulse`} />;
}

function formatSize(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Documents() {
  const [activeTab, setActiveTab] = useState('gst');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page_no: page, limit, search });
      const res = await apiCall(`/document/list/${activeTab}?${qs}`, 'GET');
      const data = await res.json();
      if (res.ok && data.success !== false) {
        setDocuments(data.data || []);
        setTotal(data.pagination?.total ?? 0);
      } else {
        setDocuments([]);
        setTotal(0);
        toast.error(data.message || 'Failed to load documents');
      }
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, limit, search]);

  useEffect(() => {
    const t = setTimeout(fetchDocuments, 300);
    return () => clearTimeout(t);
  }, [fetchDocuments]);

  const handleTab = (id) => {
    setActiveTab(id);
    setPage(1);
    setSearch('');
  };

  const openFile = (url) => {
    if (!url) {
      toast.error('File URL not available');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const tableColumns = [
    {
      key: 'type',
      label: 'Document',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white leading-snug">{row.type || '—'}</p>
          {row.remark && <p className="text-xs text-slate-500 mt-1 truncate max-w-xs">{row.remark}</p>}
        </div>
      ),
    },
    {
      key: 'firm',
      label: 'Firm / Client',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Building2 size={12} className="text-slate-400" /> {row.firm?.name || '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <User size={11} className="text-slate-400" /> {row.client?.name || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'period',
      label: 'Period',
      render: (row) => (
        <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
          {row.f_year && <p>FY {row.f_year}</p>}
          {row.month && <p>{row.month}</p>}
          {!row.f_year && !row.month && '—'}
        </div>
      ),
    },
    {
      key: 'meta',
      label: 'Uploaded',
      render: (row) => (
        <div className="text-xs text-slate-500">
          <p>{formatDate(row.create_date)}</p>
          <p className="mt-0.5">{formatSize(row.size)}</p>
        </div>
      ),
    },
  ];

  return (
    <ManagementHub
      title="Documents"
      description="GST, IT, MCA, and general documents for your firms."
      accent="blue"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={handleTab}
      onRefresh={fetchDocuments}
      refreshing={loading}
      refreshLabel="Refresh"
    >
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search firm, type, remark…"
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-md border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Pulse key={i} h="h-12" rounded="rounded-md" />)}
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-sm border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 p-16 text-center flex flex-col items-center gap-4 shadow-sm">
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
              <FileBox size={48} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-bold">No documents found</p>
            <p className="text-slate-500 text-sm">Nothing in {activeTab.toUpperCase()} yet</p>
          </div>
        ) : (
          <ManagementTable
            rows={documents}
            columns={tableColumns}
            rowKey={(row, idx) => `${row.firm?.firm_id || 'f'}-${row.type || 't'}-${row.create_date || idx}-${idx}`}
            getActions={(row) => [
              {
                id: 'open',
                label: 'Open File',
                icon: <ExternalLink size={14} />,
                onClick: () => openFile(row.file),
                disabled: !row.file,
              },
            ]}
            onRowClick={(row) => openFile(row.file)}
            accent="blue"
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
