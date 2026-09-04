import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Eye, User, CheckCircle, XCircle, Hash,
} from 'lucide-react';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';
import ManagementHub from '../components/common/ManagementHub';
import ManagementFilters from '../components/common/ManagementFilters';
import ManagementCard from '../components/common/ManagementCard';
import ManagementTable from '../components/common/ManagementTable';
import Modal from '../components/common/Modal';
import TablePagination from '../components/TablePagination';
import { formatDate } from '../utils/helpers';

const FIRM_TYPE_BADGE = {
  llp: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
  proprietorship: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
  partnership: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
  'private limited': 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800',
};
const getFirmBadge = (t) => FIRM_TYPE_BADGE[(t || '').toLowerCase()] || 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700';

function Pulse({ h = 'h-4', w = 'w-full', rounded = 'rounded' }) {
  return <div className={`${h} ${w} ${rounded} bg-slate-200 dark:bg-slate-700 animate-pulse`} />;
}

function FirmCard({ firm, onClick }) {
  return (
    <ManagementCard
      title={firm.firm_name || '—'}
      subtitle={
        <span className="flex items-center gap-1.5 mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <User size={10} className="shrink-0" />
          <span className="truncate">{firm.client?.name || '—'}</span>
        </span>
      }
      icon={<Building2 size={14} />}
      badge={
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest shrink-0 shadow-sm ${
          firm.status
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
        }`}>
          {firm.status ? 'Active' : 'Inactive'}
        </span>
      }
      onClick={onClick}
      accent="indigo"
      menuId={`firm-${firm.firm_id}`}
      actions={[{ id: 'view', label: 'View Details', icon: <Eye size={14} />, onClick }]}
      footer={
        <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
          {firm.tax?.gst_no && <span>GST: {firm.tax.gst_no}</span>}
          {firm.tax?.pan_no && <span>PAN: {firm.tax.pan_no}</span>}
        </div>
      }
    >
      {firm.firm_type && (
        <span className={`mt-2 inline-block px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-widest ${getFirmBadge(firm.firm_type)}`}>
          {firm.firm_type}
        </span>
      )}
    </ManagementCard>
  );
}

export default function Firms() {
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
  const [firms, setFirms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFirm, setSelectedFirm] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchFirms = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page_no: page, limit, search });
      const res = await apiCall(`/firm/list?${qs}`, 'GET');
      const data = await res.json();
      if (res.ok && data.success !== false) {
        setFirms(data.data || []);
        setTotal(data.pagination?.total ?? 0);
      } else {
        setFirms([]);
        setTotal(0);
        toast.error(data.message || 'Failed to load firms');
      }
    } catch {
      toast.error('Failed to load firms');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    const t = setTimeout(fetchFirms, 300);
    return () => clearTimeout(t);
  }, [fetchFirms]);

  const openDetails = async (firm) => {
    setSelectedFirm(firm);
    setDetailsLoading(true);
    try {
      const res = await apiCall(`/firm/details/${firm.firm_id}`, 'GET');
      const data = await res.json();
      if (res.ok && data.success !== false && data.data) {
        setSelectedFirm(data.data);
      }
    } catch {
      // keep list row
    } finally {
      setDetailsLoading(false);
    }
  };

  const tableColumns = [
    {
      key: 'firm',
      label: 'Firm',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white leading-snug">{row.firm_name || '—'}</p>
          {row.firm_type && (
            <span className={`mt-1.5 inline-block px-2.5 py-0.5 rounded-lg text-[10px] uppercase font-bold tracking-widest ${getFirmBadge(row.firm_type)}`}>
              {row.firm_type}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'client',
      label: 'Client',
      render: (row) => (
        <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <User size={12} className="text-slate-400" /> {row.client?.name || '—'}
        </p>
      ),
    },
    {
      key: 'tax',
      label: 'GST / PAN',
      render: (row) => (
        <div className="text-xs font-medium text-slate-600 dark:text-slate-400 space-y-0.5">
          <p>{row.tax?.gst_no || '—'}</p>
          <p>{row.tax?.pan_no || '—'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold ${
          row.status
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
        }`}>
          {row.status ? <CheckCircle size={10} /> : <XCircle size={10} />}
          {row.status ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const addr = selectedFirm?.address;

  return (
    <ManagementHub
      title="Firms"
      description="Client firms linked to your CA engagements."
      accent="indigo"
      onRefresh={fetchFirms}
      refreshing={loading}
      refreshLabel="Refresh"
    >
      <div className="space-y-4">
        <ManagementFilters
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchValue={search}
          onSearchChange={(val) => { setSearch(val); setPage(1); }}
          searchPlaceholder="Search firm, GST, PAN, client…"
        />

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-sm border border-slate-200/60 dark:border-slate-700/60 p-5">
                <Pulse h="h-5" w="w-3/4" rounded="rounded-full" />
              </div>
            ))}
          </div>
        ) : firms.length === 0 ? (
          <div className="rounded-sm border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 p-16 text-center flex flex-col items-center gap-4 shadow-sm">
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
              <Building2 size={48} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-bold">No firms found</p>
          </div>
        ) : viewMode === 'table' ? (
          <ManagementTable
            rows={firms}
            columns={tableColumns}
            rowKey="firm_id"
            getActions={(row) => [{ id: 'view', label: 'View Details', icon: <Eye size={14} />, onClick: () => openDetails(row) }]}
            onRowClick={(row) => openDetails(row)}
            accent="indigo"
            showSerialNo={true}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {firms.map((firm) => (
              <FirmCard key={firm.firm_id} firm={firm} onClick={() => openDetails(firm)} />
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

      {selectedFirm && (
        <Modal
          isOpen={!!selectedFirm}
          onClose={() => setSelectedFirm(null)}
          title="Firm Details"
          icon={Building2}
          size="lg"
        >
          {detailsLoading ? (
            <div className="space-y-3 py-4">
              <Pulse h="h-6" w="w-2/3" />
              <Pulse h="h-24" />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{selectedFirm.firm_name || '—'}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedFirm.firm_type && (
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] uppercase font-bold tracking-widest ${getFirmBadge(selectedFirm.firm_type)}`}>
                      {selectedFirm.firm_type}
                    </span>
                  )}
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    selectedFirm.status ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {selectedFirm.status ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-sm border border-slate-100 dark:border-slate-700/50">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Client</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{selectedFirm.client?.name || '—'}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-sm border border-slate-100 dark:border-slate-700/50">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Tax IDs</p>
                  <div className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                    <p className="flex items-center gap-1.5"><Hash size={12} className="text-slate-400" /> GST: {selectedFirm.tax?.gst_no || '—'}</p>
                    <p className="flex items-center gap-1.5"><Hash size={12} className="text-slate-400" /> PAN: {selectedFirm.tax?.pan_no || '—'}</p>
                    <p className="flex items-center gap-1.5"><Hash size={12} className="text-slate-400" /> File No: {selectedFirm.tax?.file_no || '—'}</p>
                  </div>
                </div>
              </div>

              {addr && (
                <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-sm border border-slate-100 dark:border-slate-700/50">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Address</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {[addr.address_line_1, addr.address_line_2, addr.city, addr.district, addr.state, addr.pincode, addr.country]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </p>
                </div>
              )}

              {selectedFirm.audit?.create_date && (
                <p className="text-xs text-slate-400">Created: {formatDate(selectedFirm.audit.create_date)}</p>
              )}
            </div>
          )}
        </Modal>
      )}
    </ManagementHub>
  );
}
