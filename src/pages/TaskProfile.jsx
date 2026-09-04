import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Clock,
  Download,
  FileBox,
  FileText,
  Hash,
  Info,
  MapPin,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  User,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiCall } from '../utils/apiCall';
import { uploadOneSaasFile, UploadAbortedError } from '../utils/onesaas-upload';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import TablePagination from '../components/TablePagination';
import { formatDate } from '../utils/helpers';

const STATUS_MAP = {
  'in process': {
    label: 'In Process',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
    ring: 'from-blue-500 to-indigo-500',
  },
  complete: {
    label: 'Complete',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    ring: 'from-emerald-500 to-teal-500',
  },
  'pending from department': {
    label: 'Dept. Pending',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
    ring: 'from-orange-500 to-amber-500',
  },
  'pending from client': {
    label: 'Client Pending',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    ring: 'from-amber-500 to-yellow-500',
  },
  cancel: {
    label: 'Cancelled',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
    ring: 'from-rose-500 to-red-500',
  },
};

const getStatus = (s) => {
  const key = (s || '').toLowerCase().trim();
  return (
    STATUS_MAP[key] || {
      label: s || 'Unknown',
      badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
      ring: 'from-slate-500 to-slate-600',
    }
  );
};

const FIRM_TYPE_BADGE = {
  llp: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
  proprietorship: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
  partnership: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
  'private limited': 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800',
};

const getFirmBadge = (type) => {
  const key = String(type || '').toLowerCase().trim();
  return FIRM_TYPE_BADGE[key] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
};

const TABS = [
  { id: 'basic', label: 'Basic', icon: Info },
  { id: 'firm', label: 'Firm', icon: Building2 },
  { id: 'document', label: 'Document', icon: FileBox },
  { id: 'udin', label: 'UDIN', icon: Shield },
];

const VALID_TABS = new Set(TABS.map((t) => t.id));

const CARD_THEMES = {
  sky: {
    wrap: 'border-sky-200/80 dark:border-sky-800/50 bg-gradient-to-br from-sky-50 via-white to-white dark:from-sky-950/40 dark:via-gray-900 dark:to-gray-900',
    iconWrap: 'bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-300',
    title: 'text-sky-700 dark:text-sky-300',
  },
  violet: {
    wrap: 'border-violet-200/80 dark:border-violet-800/50 bg-gradient-to-br from-violet-50 via-white to-white dark:from-violet-950/40 dark:via-gray-900 dark:to-gray-900',
    iconWrap: 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-300',
    title: 'text-violet-700 dark:text-violet-300',
  },
  amber: {
    wrap: 'border-amber-200/80 dark:border-amber-800/50 bg-gradient-to-br from-amber-50 via-white to-white dark:from-amber-950/40 dark:via-gray-900 dark:to-gray-900',
    iconWrap: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300',
    title: 'text-amber-700 dark:text-amber-300',
  },
  emerald: {
    wrap: 'border-emerald-200/80 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-50 via-white to-white dark:from-emerald-950/40 dark:via-gray-900 dark:to-gray-900',
    iconWrap: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300',
    title: 'text-emerald-700 dark:text-emerald-300',
  },
  rose: {
    wrap: 'border-rose-200/80 dark:border-rose-800/50 bg-gradient-to-br from-rose-50 via-white to-white dark:from-rose-950/40 dark:via-gray-900 dark:to-gray-900',
    iconWrap: 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300',
    title: 'text-rose-700 dark:text-rose-300',
  },
  indigo: {
    wrap: 'border-indigo-200/80 dark:border-indigo-800/50 bg-gradient-to-br from-indigo-50 via-white to-white dark:from-indigo-950/40 dark:via-gray-900 dark:to-gray-900',
    iconWrap: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300',
    title: 'text-indigo-700 dark:text-indigo-300',
  },
};

function Pulse({ h = 'h-4', w = 'w-full', rounded = 'rounded-lg' }) {
  return <div className={`${h} ${w} ${rounded} bg-slate-200 dark:bg-slate-700 animate-pulse`} />;
}

function formatSize(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function DetailCard({ title, icon: Icon, theme = 'sky', children }) {
  const t = CARD_THEMES[theme] || CARD_THEMES.sky;
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${t.wrap}`}>
      <div className="mb-3 flex items-center gap-2.5">
        {Icon ? (
          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${t.iconWrap}`}>
            <Icon size={15} strokeWidth={2.25} />
          </span>
        ) : null}
        <p className={`text-[11px] font-bold uppercase tracking-wider ${t.title}`}>{title}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ label, icon: Icon, iconClass = 'text-slate-400', children, last = false }) {
  return (
    <div className={`flex items-start justify-between gap-3 py-2.5 ${last ? '' : 'border-b border-slate-100/80 dark:border-gray-800'}`}>
      <span className="inline-flex shrink-0 items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400">
        {Icon ? <Icon size={13} className={iconClass} /> : null}
        {label}
      </span>
      <div className="min-w-0 text-right text-sm font-semibold text-slate-800 dark:text-gray-100">
        {children}
      </div>
    </div>
  );
}

async function downloadFromUrl(fileUrl, suggestedName) {
  try {
    const fileRes = await fetch(fileUrl);
    const blob = await fileRes.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = suggestedName || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = suggestedName || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export default function TaskProfile() {
  const navigate = useNavigate();
  const { taskId, tab: tabParam } = useParams();
  const activeTab = VALID_TABS.has(tabParam) ? tabParam : 'basic';

  const [task, setTask] = useState(null);
  const [firm, setFirm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firmLoading, setFirmLoading] = useState(false);
  const [firmLoadedId, setFirmLoadedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsReady, setDocsReady] = useState(false);
  const [docPage, setDocPage] = useState(1);
  const [docLimit, setDocLimit] = useState(20);
  const [docTotal, setDocTotal] = useState(0);
  const [docSearch, setDocSearch] = useState('');
  const [docScope, setDocScope] = useState('office'); // office | me
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const docsRequestId = useRef(0);

  const [udinDraft, setUdinDraft] = useState('');
  const [udinDocs, setUdinDocs] = useState([]);
  const [savingUdin, setSavingUdin] = useState(false);
  const [completingUdin, setCompletingUdin] = useState(false);
  const udinUploadAborts = useRef(new Map());

  const MAX_UDIN_FILE_BYTES = 10 * 1024 * 1024;

  const createUdinDocRow = useCallback((file = null, index = 0) => {
    const fileName = file?.name || '';
    const guessed = fileName
      ? fileName.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim() || fileName
      : '';
    return {
      id: `${Date.now()}_${index}_${Math.random().toString(36).slice(2, 9)}`,
      file,
      fileName,
      name: guessed || 'UDIN Document',
      remark: '',
      url: '',
      uploading: false,
      uploadProgress: 0,
      uploadError: '',
    };
  }, []);

  const patchUdinDoc = useCallback((rowId, patch) => {
    setUdinDocs((prev) =>
      prev.map((d) => (d.id === rowId ? { ...d, ...patch } : d))
    );
  }, []);

  const abortUdinUpload = useCallback((rowId) => {
    const abort = udinUploadAborts.current.get(rowId);
    if (abort) {
      abort();
      udinUploadAborts.current.delete(rowId);
    }
  }, []);

  const removeUdinDoc = useCallback(
    (rowId) => {
      abortUdinUpload(rowId);
      setUdinDocs((prev) => prev.filter((d) => d.id !== rowId));
    },
    [abortUdinUpload]
  );

  const clearUdinDocs = useCallback(() => {
    udinUploadAborts.current.forEach((abort) => abort());
    udinUploadAborts.current.clear();
    setUdinDocs([]);
  }, []);

  /** Upload one selected file to upload.onesaas.in (same as CLIENT). */
  const startUdinFileUpload = useCallback(
    async (rowId, file) => {
      if (!file) return;

      abortUdinUpload(rowId);

      if (file.size > MAX_UDIN_FILE_BYTES) {
        patchUdinDoc(rowId, {
          uploading: false,
          uploadProgress: 0,
          uploadError: 'File exceeds the 10MB limit.',
          url: '',
        });
        return;
      }

      patchUdinDoc(rowId, {
        uploading: true,
        uploadProgress: 0,
        uploadError: '',
        url: '',
        file,
        fileName: file.name,
      });

      const uploadPromise = uploadOneSaasFile(file, (pct) => {
        patchUdinDoc(rowId, { uploadProgress: pct });
      });
      udinUploadAborts.current.set(rowId, () => uploadPromise.abort());

      try {
        const { url } = await uploadPromise;
        if (!url) throw new Error('Upload did not return a file URL');
        // Card may have been removed while upload finished
        setUdinDocs((prev) => {
          if (!prev.some((d) => d.id === rowId)) return prev;
          return prev.map((d) =>
            d.id === rowId
              ? {
                  ...d,
                  url,
                  uploading: false,
                  uploadProgress: 100,
                  uploadError: '',
                }
              : d
          );
        });
      } catch (err) {
        if (err instanceof UploadAbortedError || err?.code === 'ABORTED') {
          return;
        }
        setUdinDocs((prev) => {
          if (!prev.some((d) => d.id === rowId)) return prev;
          return prev.map((d) =>
            d.id === rowId
              ? {
                  ...d,
                  uploading: false,
                  uploadProgress: 0,
                  uploadError: err?.message || 'Upload failed',
                  url: '',
                }
              : d
          );
        });
      } finally {
        udinUploadAborts.current.delete(rowId);
      }
    },
    [MAX_UDIN_FILE_BYTES, abortUdinUpload, patchUdinDoc]
  );

  /** OS multi-select → one card per file, upload starts immediately. */
  const appendUdinFiles = useCallback(
    (fileList) => {
      const files = Array.from(fileList || []).filter(Boolean);
      if (!files.length) return;
      const rows = files.map((file, index) => ({
        ...createUdinDocRow(file, index),
        uploading: true,
        uploadProgress: 0,
      }));
      setUdinDocs((prev) => [...prev, ...rows]);
      rows.forEach((row) => {
        if (row.file) startUdinFileUpload(row.id, row.file);
      });
    },
    [createUdinDocRow, startUdinFileUpload]
  );

  const setTab = useCallback(
    (id) => {
      if (!taskId || !VALID_TABS.has(id)) return;
      navigate(`/tasks/${taskId}/${id}`, { replace: true });
    },
    [navigate, taskId]
  );

  useEffect(() => {
    if (taskId && (!tabParam || !VALID_TABS.has(tabParam))) {
      navigate(`/tasks/${taskId}/basic`, { replace: true });
    }
  }, [taskId, tabParam, navigate]);

  const fetchTask = useCallback(async ({ silent = false } = {}) => {
    if (!taskId) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await apiCall(`/task/details/${taskId}`, 'GET');
      const data = await res.json();
      if (res.ok && data.success !== false && data.data) {
        setTask(data.data);
        setUdinDraft(data.data.udin || '');
      } else {
        setTask(null);
        toast.error(data.message || 'Failed to load task');
      }
    } catch {
      setTask(null);
      toast.error('Failed to load task');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [taskId]);

  const fetchFirm = useCallback(async (firmId) => {
    if (!firmId) {
      setFirm(null);
      setFirmLoadedId(null);
      return;
    }
    setFirmLoading(true);
    try {
      const res = await apiCall(`/firm/details/${firmId}`, 'GET');
      const data = await res.json();
      if (res.ok && data.success !== false && data.data) {
        setFirm(data.data);
        setFirmLoadedId(firmId);
      } else {
        setFirm(null);
        setFirmLoadedId(null);
        toast.error(data.message || 'Failed to load firm');
      }
    } catch {
      setFirm(null);
      setFirmLoadedId(null);
      toast.error('Failed to load firm');
    } finally {
      setFirmLoading(false);
    }
  }, []);

  const fetchDocuments = useCallback(async () => {
    if (!taskId) return;
    const requestId = ++docsRequestId.current;
    setDocsLoading(true);
    try {
      const qs = new URLSearchParams({
        page_no: String(docPage),
        limit: String(docLimit),
        search: docSearch,
        scope: docScope === 'me' ? 'me' : 'office',
      });
      const res = await apiCall(`/task/details/${taskId}/documents?${qs}`, 'GET');
      const data = await res.json();
      if (requestId !== docsRequestId.current) return;
      if (res.ok && data.success !== false) {
        setDocuments(data.data || []);
        setDocTotal(data.pagination?.total ?? 0);
      } else {
        setDocuments([]);
        setDocTotal(0);
        toast.error(data.message || 'Failed to load documents');
      }
    } catch {
      if (requestId !== docsRequestId.current) return;
      setDocuments([]);
      setDocTotal(0);
      toast.error('Failed to load documents');
    } finally {
      if (requestId === docsRequestId.current) {
        setDocsLoading(false);
        setDocsReady(true);
      }
    }
  }, [taskId, docPage, docLimit, docSearch, docScope]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  useEffect(() => {
    if (activeTab !== 'firm') return;
    const firmId = task?.firm?.firm_id;
    if (!firmId) return;
    if (firmLoadedId === firmId && firm) return;
    setFirmLoading(true);
    fetchFirm(firmId);
  }, [activeTab, task?.firm?.firm_id, firmLoadedId, firm, fetchFirm]);

  // Document tab: show skeleton immediately (no empty flash), debounce only search
  useEffect(() => {
    if (activeTab !== 'document') return undefined;

    setDocsLoading(true);
    setDocsReady(false);

    const delay = docSearch ? 300 : 0;
    const t = setTimeout(() => {
      fetchDocuments();
    }, delay);

    return () => {
      clearTimeout(t);
      docsRequestId.current += 1;
    };
  }, [activeTab, taskId, docPage, docLimit, docSearch, docScope, fetchDocuments]);

  const handleRefresh = () => {
    fetchTask({ silent: true });
    if (activeTab === 'firm' && task?.firm?.firm_id) {
      setFirmLoadedId(null);
      fetchFirm(task.firm.firm_id);
    }
    if (activeTab === 'document') {
      setDocsReady(false);
      setDocsLoading(true);
      fetchDocuments();
    }
  };

  const handleDownload = async (doc) => {
    if (!doc?.file) {
      toast.error('File not available');
      return;
    }
    setDownloadingId(doc.document_id);
    const toastId = toast.loading('Downloading…');
    try {
      const ext = (doc.mime_type || '').includes('pdf') ? '.pdf' : '';
      const name = `${doc.name || doc.document_id || 'document'}${ext}`;
      await downloadFromUrl(doc.file, name);
      toast.success('Download started', { id: toastId });
    } catch {
      toast.error('Failed to download', { id: toastId });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteDocument = async (doc) => {
    if (!doc?.document_id || !taskId) return;
    if (!doc.can_delete) {
      toast.error('You can only delete documents you uploaded');
      return;
    }
    if (String(task?.ca_approval || '').toLowerCase() === 'complete') {
      toast.error('Documents cannot be deleted after CA approval is complete');
      return;
    }
    const toastId = toast.loading('Deleting document…');
    setDeletingId(doc.document_id);
    try {
      const res = await apiCall(`/task/details/${taskId}/documents`, 'DELETE', {
        document_ids: [doc.document_id],
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to delete document');
      }
      toast.success(data.message || 'Document deleted', { id: toastId });
      setDocsReady(false);
      setDocsLoading(true);
      fetchDocuments();
    } catch (err) {
      toast.error(err.message || 'Failed to delete document', { id: toastId });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveUdin = async ({ markComplete = false } = {}) => {
    const value = String(udinDraft || '').trim();
    if (!value) {
      toast.error('Please enter the UDIN number');
      return;
    }
    if (udinDocs.some((d) => d.uploading)) {
      toast.error('Please wait for uploads to finish');
      return;
    }
    if (udinDocs.some((d) => d.uploadError || !String(d.url || '').trim())) {
      toast.error('Fix or remove failed uploads before saving');
      return;
    }

    setSavingUdin(true);
    const toastId = toast.loading(markComplete ? 'Saving UDIN & completing…' : 'Saving UDIN…');
    try {
      const documents = udinDocs
        .filter((row) => String(row.url || '').trim())
        .map((row) => {
          const doc = { url: String(row.url).trim() };
          const name = String(row.name || '').trim();
          const remark = String(row.remark || '').trim();
          if (name) doc.name = name;
          if (remark) doc.remark = remark;
          return doc;
        });

      const res = await apiCall(`/task/details/${taskId}/udin`, 'PUT', {
        udin: value,
        documents,
        mark_complete: Boolean(markComplete),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to save UDIN');
      }
      setTask((prev) => ({
        ...prev,
        udin: data.data?.udin ?? value,
        ca_approval: data.data?.ca_approval || prev?.ca_approval,
      }));
      setUdinDocs([]);
      toast.success(data.message || 'UDIN saved', { id: toastId });
      setDocsReady(false);
      if (activeTab === 'document' || documents.length > 0) {
        setDocsLoading(true);
        fetchDocuments();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save UDIN', { id: toastId });
    } finally {
      setSavingUdin(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!String(udinDraft || task?.udin || '').trim()) {
      toast.error('Please save the UDIN number first');
      return;
    }
    if (
      udinDocs.length > 0 ||
      String(udinDraft || '').trim() !== String(task?.udin || '').trim()
    ) {
      await handleSaveUdin({ markComplete: true });
      return;
    }
    setCompletingUdin(true);
    const toastId = toast.loading('Marking complete…');
    try {
      const res = await apiCall(`/task/details/${taskId}/udin/complete`, 'PUT', {});
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to mark complete');
      }
      setTask((prev) => ({
        ...prev,
        ca_approval: 'complete',
        udin: data.data?.udin ?? prev?.udin,
      }));
      clearUdinDocs();
      toast.success(data.message || 'Marked complete', { id: toastId });
      setDocsReady(false);
      if (activeTab === 'document') {
        setDocsLoading(true);
        fetchDocuments();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to mark complete', { id: toastId });
    } finally {
      setCompletingUdin(false);
    }
  };

  const statusInfo = useMemo(() => getStatus(task?.status), [task?.status]);
  const caApproval = String(task?.ca_approval || 'pending').toLowerCase();
  const udinEditable = caApproval === 'sent';
  const udinUploading = udinDocs.some((d) => d.uploading);
  const udinReadyCount = udinDocs.filter((d) => d.url && !d.uploading && !d.uploadError).length;
  const addr = firm?.address;
  const showDocsSkeleton = activeTab === 'document' && (!docsReady || docsLoading);

  const documentColumns = [
    {
      key: 'name',
      label: 'Document',
      render: (row) => (
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300">
            <FileText size={14} />
          </span>
          <div>
            <p className="font-bold text-slate-900 dark:text-white leading-snug">{row.name || '—'}</p>
            <p className="mt-0.5 text-[10px] text-slate-400">{formatSize(row.size)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'remark',
      label: 'Remark',
      render: (row) => (
        <p className="max-w-[220px] truncate text-sm text-slate-600 dark:text-gray-300">
          {row.remark?.trim() ? row.remark : '—'}
        </p>
      ),
    },
    {
      key: 'meta',
      label: 'Uploaded',
      render: (row) => (
        <div className="text-xs text-slate-500">
          <p className="inline-flex items-center gap-1">
            <CalendarDays size={11} className="text-violet-500" />
            {formatDate(row.create_date)}
          </p>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <ManagementHub title="Task Profile" description="Loading task…" accent="blue">
        <div className="space-y-4">
          <Pulse h="h-24" rounded="rounded-xl" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Pulse h="h-40" rounded="rounded-xl" />
            <Pulse h="h-40" rounded="rounded-xl" />
            <Pulse h="h-40" rounded="rounded-xl" />
          </div>
        </div>
      </ManagementHub>
    );
  }

  if (!task) {
    return (
      <ManagementHub title="Task Profile" description="Task not found" accent="blue">
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/30 dark:to-gray-900 p-10 text-center">
          <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-500">
            <FileBox size={28} />
          </span>
          <p className="mt-4 text-lg font-bold text-slate-700 dark:text-gray-200">Task not found</p>
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <ArrowLeft size={14} /> Back to Tasks
          </button>
        </div>
      </ManagementHub>
    );
  }

  return (
    <ManagementHub
      title={task.service?.name || 'Task Profile'}
      description={`Task ID: ${task.task_id}${task.client?.name ? ` · ${task.client.name}` : ''}`}
      accent="blue"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setTab}
      onRefresh={handleRefresh}
      refreshing={refreshing || (activeTab === 'firm' && firmLoading) || (activeTab === 'document' && docsLoading)}
      refreshLabel="Refresh"
      actions={(
        <button
          type="button"
          onClick={() => navigate('/tasks')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700"
        >
          <ArrowLeft size={14} /> Back
        </button>
      )}
    >
      {activeTab === 'basic' && (
        <div className="space-y-4">
          <div className={`relative overflow-hidden rounded-xl border border-slate-200/80 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm`}>
            <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${statusInfo.ring}`} />
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${statusInfo.ring} text-white shadow-md`}>
                  <Briefcase size={22} />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {task.service?.name || 'Task'}
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-gray-400">
                    {task.task_id}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold shadow-sm ${statusInfo.badge}`}>
                  <Sparkles size={11} />
                  {statusInfo.label}
                </span>
                {task.task_type ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                    <Tag size={11} />
                    {task.task_type}
                  </span>
                ) : null}
                {task.ca_approval ? (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    caApproval === 'complete'
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : caApproval === 'sent'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    <Shield size={11} />
                    CA: {caApproval}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <DetailCard title="Client & Firm" icon={User} theme="sky">
              <Field label="Client" icon={User} iconClass="text-sky-500">
                {task.client?.name || '—'}
              </Field>
              <Field label="Firm" icon={Building2} iconClass="text-sky-500">
                {task.firm?.firm_name || '—'}
              </Field>
              <Field label="Firm type" icon={Tag} iconClass="text-sky-500" last>
                {task.firm?.firm_type || '—'}
              </Field>
            </DetailCard>

            <DetailCard title="Service" icon={Briefcase} theme="violet">
              <Field label="Service" icon={Briefcase} iconClass="text-violet-500">
                {task.service?.name || '—'}
              </Field>
              <Field label="Type" icon={Tag} iconClass="text-violet-500">
                {task.service?.type || '—'}
              </Field>
              <Field label="Frequency" icon={RefreshCw} iconClass="text-violet-500" last>
                {task.service?.frequency || '—'}
              </Field>
            </DetailCard>

            <DetailCard title="Timeline" icon={Clock} theme="amber">
              <Field label="Due date" icon={CalendarClock} iconClass="text-amber-500">
                {formatDate(task.dates?.due_date)}
              </Field>
              <Field label="Target date" icon={Calendar} iconClass="text-amber-500">
                {formatDate(task.dates?.target_date)}
              </Field>
              <Field label="Complete date" icon={CalendarCheck} iconClass="text-emerald-500">
                {formatDate(task.dates?.complete_date)}
              </Field>
              <Field label="Created" icon={CalendarDays} iconClass="text-amber-500">
                {formatDate(task.dates?.create_date)}
              </Field>
              <Field label="Compliance year" icon={Calendar} iconClass="text-indigo-500">
                {task.compliance_year || task.dates?.compliance_year || '—'}
              </Field>
              <Field label="Compliance period" icon={CalendarDays} iconClass="text-indigo-500" last>
                {task.compliance_period || task.dates?.compliance_period || '—'}
              </Field>
            </DetailCard>
          </div>
        </div>
      )}

      {activeTab === 'firm' && (
        <div className="space-y-4">
          {firmLoading ? (
            <div className="space-y-4">
              <Pulse h="h-24" rounded="rounded-xl" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Pulse h="h-36" rounded="rounded-xl" />
                <Pulse h="h-36" rounded="rounded-xl" />
              </div>
            </div>
          ) : !firm ? (
            <div className="rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-10 text-center">
              <Building2 size={40} className="mx-auto text-slate-300 dark:text-gray-600" />
              <p className="mt-3 font-bold text-slate-600 dark:text-gray-300">Firm details unavailable</p>
            </div>
          ) : (
            <>
              <div className="relative overflow-hidden rounded-xl border border-violet-200/80 dark:border-violet-800/50 bg-gradient-to-br from-violet-50 via-white to-white dark:from-violet-950/40 dark:via-gray-900 dark:to-gray-900 p-5 shadow-sm">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
                <div className="flex flex-wrap items-start gap-3">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md">
                    <Building2 size={22} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {firm.firm_name || '—'}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {firm.firm_type ? (
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] uppercase font-bold tracking-widest ${getFirmBadge(firm.firm_type)}`}>
                          {firm.firm_type}
                        </span>
                      ) : null}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        firm.status
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {firm.status ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DetailCard title="Client" icon={User} theme="sky">
                  <p className="inline-flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                    <User size={14} className="text-sky-500" />
                    {firm.client?.name || '—'}
                  </p>
                </DetailCard>

                <DetailCard title="Tax IDs" icon={Hash} theme="emerald">
                  <Field label="GST" icon={Hash} iconClass="text-emerald-500">
                    {firm.tax?.gst_no || '—'}
                  </Field>
                  <Field label="PAN" icon={Hash} iconClass="text-emerald-500">
                    {firm.tax?.pan_no || '—'}
                  </Field>
                  <Field label="TAN" icon={Hash} iconClass="text-emerald-500">
                    {firm.tax?.tan_no || '—'}
                  </Field>
                  <Field label="File No" icon={Hash} iconClass="text-emerald-500" last>
                    {firm.tax?.file_no || '—'}
                  </Field>
                </DetailCard>
              </div>

              {addr ? (
                <DetailCard title="Address" icon={MapPin} theme="rose">
                  <p className="inline-flex items-start gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-rose-500" />
                    <span>
                      {[addr.address_line_1, addr.address_line_2, addr.city, addr.district, addr.state, addr.pincode, addr.country]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </span>
                  </p>
                </DetailCard>
              ) : null}
            </>
          )}
        </div>
      )}

      {activeTab === 'document' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-900 p-1 shadow-sm">
              {[
                { id: 'office', label: 'Office' },
                { id: 'me', label: 'Me (CA)' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (docScope === item.id) return;
                    setDocScope(item.id);
                    setDocPage(1);
                    setDocsReady(false);
                    setDocsLoading(true);
                  }}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                    docScope === item.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {docScope === 'me' ? (
              <button
                type="button"
                onClick={() => setTab('udin')}
                disabled={caApproval !== 'sent'}
                title={
                  caApproval === 'sent'
                    ? 'Upload documents via UDIN tab'
                    : 'Upload is available only when CA approval is Sent'
                }
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Upload size={14} />
                Upload
              </button>
            ) : null}
          </div>

          <div className="relative max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
            <input
              type="text"
              value={docSearch}
              onChange={(e) => {
                setDocSearch(e.target.value);
                setDocPage(1);
              }}
              placeholder={docScope === 'me' ? 'Search my documents…' : 'Search office documents…'}
              className="w-full rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-gradient-to-r from-indigo-50/80 to-white dark:from-indigo-950/30 dark:to-gray-800 py-2.5 pl-9 pr-3 text-sm text-slate-800 dark:text-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          {showDocsSkeleton ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Pulse key={i} h="h-14" rounded="rounded-xl" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-indigo-300 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/30 dark:to-gray-900 p-12 text-center">
              <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-500">
                <FileBox size={28} />
              </span>
              <p className="mt-3 font-bold text-slate-700 dark:text-gray-200">No documents found</p>
              <p className="mt-1 text-sm text-slate-500">
                {docScope === 'me'
                  ? 'Documents you upload from the UDIN tab will appear here'
                  : 'Office-uploaded task documents will appear here when available'}
              </p>
            </div>
          ) : (
            <ManagementTable
              rows={documents}
              columns={documentColumns}
              rowKey="document_id"
              getActions={(row) => {
                const actions = [
                  {
                    id: 'download',
                    label: downloadingId === row.document_id ? 'Downloading…' : 'Download',
                    icon: <Download size={14} />,
                    onClick: () => handleDownload(row),
                    disabled: !row.file || downloadingId === row.document_id || deletingId === row.document_id,
                  },
                ];
                if (docScope === 'me' && row.can_delete && caApproval !== 'complete') {
                  actions.push({
                    id: 'delete',
                    label: deletingId === row.document_id ? 'Deleting…' : 'Delete',
                    icon: <Trash2 size={14} />,
                    onClick: () => handleDeleteDocument(row),
                    disabled: deletingId === row.document_id || downloadingId === row.document_id,
                    danger: true,
                  });
                }
                return actions;
              }}
              accent="blue"
              showSerialNo
            />
          )}

          {docsReady && !docsLoading ? (
            <TablePagination
              page={docPage}
              limit={docLimit}
              total={docTotal}
              totalPages={Math.max(1, Math.ceil(docTotal / docLimit) || 1)}
              rowOptions={[5, 10, 20, 50, 100]}
              defaultRows={20}
              onPageChange={setDocPage}
              onLimitChange={(l) => {
                setDocLimit(l);
                setDocPage(1);
              }}
            />
          ) : null}
        </div>
      )}

      {activeTab === 'udin' && (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-xl border border-teal-200/80 dark:border-teal-800/50 bg-gradient-to-br from-teal-50 via-white to-cyan-50 dark:from-teal-950/40 dark:via-gray-900 dark:to-cyan-950/20 p-5 shadow-sm">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-teal-500 to-cyan-500" />
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-md">
                  <Shield size={22} />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">UDIN</h3>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-gray-400">
                    Upload UDIN after the branch sends the task for CA approval.
                  </p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border ${
                caApproval === 'complete'
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  : caApproval === 'sent'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                Approval: {caApproval}
              </span>
            </div>
          </div>

          {caApproval === 'pending' ? (
            <div className="rounded-xl border border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20 p-10 text-center">
              <Sparkles size={28} className="mx-auto text-amber-500" />
              <p className="mt-3 font-bold text-slate-700 dark:text-gray-200">Waiting for CA approval request</p>
              <p className="mt-1 text-sm text-slate-500">
                This tab becomes active when the branch sets CA approval to <span className="font-semibold">Sent</span>.
              </p>
            </div>
          ) : (
            <DetailCard title="UDIN details" icon={Shield} theme="emerald">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    UDIN Number
                  </label>
                  <input
                    type="text"
                    value={udinDraft}
                    onChange={(e) => setUdinDraft(e.target.value)}
                    disabled={!udinEditable || savingUdin || completingUdin}
                    placeholder="Enter UDIN number"
                    maxLength={100}
                    readOnly={!udinEditable}
                    className="w-full rounded-lg border border-teal-200 dark:border-teal-800 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm font-semibold text-slate-800 dark:text-gray-100 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:opacity-60"
                  />
                  {caApproval === 'complete' ? (
                    <p className="mt-1.5 text-xs text-slate-500">
                      Locked — UDIN and documents cannot be changed after completion.
                    </p>
                  ) : null}
                </div>

                {udinEditable ? (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Documents (optional)
                  </label>

                  <label className={`mb-3 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-teal-300 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-950/20 px-4 py-6 ${
                    savingUdin || completingUdin
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-950/30'
                  }`}>
                    <Upload size={20} className="text-teal-600" />
                    <span className="text-sm font-medium text-slate-700 dark:text-gray-200">
                      Browse and select multiple files
                    </span>
                    <span className="text-center text-xs text-slate-500">
                      Files upload immediately to OneSaaS — each becomes its own card below
                    </span>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      disabled={savingUdin || completingUdin}
                      onChange={(e) => {
                        appendUdinFiles(e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </label>

                  {udinDocs.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-slate-600 dark:text-gray-300">
                          {udinUploading
                            ? `Uploading… ${udinReadyCount}/${udinDocs.length} ready`
                            : `${udinReadyCount} of ${udinDocs.length} file${udinDocs.length === 1 ? '' : 's'} uploaded`}
                        </p>
                        <button
                          type="button"
                          onClick={clearUdinDocs}
                          disabled={savingUdin || completingUdin}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-50"
                        >
                          Clear all
                        </button>
                      </div>
                      {udinDocs.map((row, idx) => (
                        <div
                          key={row.id}
                          className={`rounded-lg border p-3 shadow-sm ${
                            row.uploadError
                              ? 'border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20'
                              : row.url
                                ? 'border-emerald-300/80 dark:border-emerald-800 bg-white dark:bg-gray-800/80'
                                : 'border-teal-200/80 dark:border-teal-800 bg-white dark:bg-gray-800/80'
                          }`}
                        >
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                row.uploadError
                                  ? 'bg-rose-100 text-rose-700'
                                  : row.url
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300'
                              }`}>
                                {row.uploading ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : row.url ? (
                                  <CheckCircle2 size={14} />
                                ) : (
                                  <FileText size={14} />
                                )}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-slate-800 dark:text-gray-100">
                                  {row.fileName || row.file?.name || `Document ${idx + 1}`}
                                </p>
                                <p className="text-[10px] text-slate-500">
                                  {row.uploading
                                    ? `Uploading ${row.uploadProgress || 0}%`
                                    : row.uploadError
                                      ? row.uploadError
                                      : row.url
                                        ? 'Uploaded to OneSaaS'
                                        : row.file?.size
                                          ? `${Math.max(1, Math.round(row.file.size / 1024))} KB`
                                          : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              {row.uploadError && row.file ? (
                                <button
                                  type="button"
                                  onClick={() => startUdinFileUpload(row.id, row.file)}
                                  disabled={savingUdin || completingUdin}
                                  className="rounded-md px-2 py-1 text-[10px] font-semibold text-teal-700 hover:bg-teal-50 disabled:opacity-50"
                                  title="Retry upload"
                                >
                                  Retry
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => removeUdinDoc(row.id)}
                                disabled={savingUdin || completingUdin}
                                className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                                title={row.uploading ? 'Cancel upload & remove' : 'Remove'}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          {row.uploading ? (
                            <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-teal-100 dark:bg-teal-900/40">
                              <div
                                className="h-full rounded-full bg-teal-500 transition-all"
                                style={{ width: `${row.uploadProgress || 0}%` }}
                              />
                            </div>
                          ) : null}
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                Name
                              </label>
                              <input
                                type="text"
                                value={row.name}
                                onChange={(e) =>
                                  setUdinDocs((prev) =>
                                    prev.map((d) =>
                                      d.id === row.id ? { ...d, name: e.target.value } : d
                                    )
                                  )
                                }
                                disabled={savingUdin || completingUdin}
                                className="w-full rounded-md border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-2.5 py-1.5 text-sm text-slate-800 dark:text-gray-100 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                Remark
                              </label>
                              <input
                                type="text"
                                value={row.remark}
                                onChange={(e) =>
                                  setUdinDocs((prev) =>
                                    prev.map((d) =>
                                      d.id === row.id ? { ...d, remark: e.target.value } : d
                                    )
                                  )
                                }
                                disabled={savingUdin || completingUdin}
                                placeholder="Optional"
                                className="w-full rounded-md border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-2.5 py-1.5 text-sm text-slate-800 dark:text-gray-100 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                ) : (
                  <p className="rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/60 px-3 py-2.5 text-sm text-slate-600 dark:text-gray-300">
                    View uploaded files on the <span className="font-semibold">Document</span> tab. Deletion is disabled after completion.
                  </p>
                )}

                {udinEditable ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSaveUdin({ markComplete: false })}
                    disabled={savingUdin || completingUdin || udinUploading}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingUdin && !completingUdin ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    Save UDIN
                  </button>
                  <button
                    type="button"
                    onClick={handleMarkComplete}
                    disabled={savingUdin || completingUdin || udinUploading}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {completingUdin || savingUdin ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Shield size={14} />
                    )}
                    Mark Complete
                  </button>
                </div>
                ) : caApproval === 'complete' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                    <CheckCircle2 size={14} /> Completed
                  </span>
                ) : null}
              </div>
            </DetailCard>
          )}
        </div>
      )}
    </ManagementHub>
  );
}
