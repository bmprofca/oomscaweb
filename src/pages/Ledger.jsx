import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  FiDownload,
  FiRefreshCw,
  FiEye,
  FiFile,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { DateRangePickerField, toIsoDate } from '../components/PortalDatePicker';
import TransactionTable, {
  getTransactionAmounts,
  formatLedgerCurrency,
} from '../components/TransactionTable';
import { usePagination } from '../components/common/PaginationComponent';
import TablePagination from '../components/TablePagination';
import { ViewTransactionModalManager } from '../components/Modals/ViewTransactions';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/apiCall';
import { buildLedgerDownloadFilename } from '../utils/ledgerFilename';

const API_BASE = (process.env.REACT_APP_BASE_API_URL || 'http://localhost:8877/ca').replace(/\/$/, '');

const normalizeOpeningBalance = (openingBal) => {
  if (typeof openingBal === 'object' && openingBal !== null) {
    return {
      debit: openingBal.debit ?? 0,
      credit: openingBal.credit ?? 0,
      balance: openingBal.balance ?? 0,
    };
  }
  return { debit: 0, credit: 0, balance: Number(openingBal) || 0 };
};

const calculateSummary = (transactionsData, openingBalObj) => {
  let totalCredit = openingBalObj?.credit ?? 0;
  let totalDebit = openingBalObj?.debit ?? 0;
  let closingBalance = openingBalObj?.balance ?? 0;

  transactionsData.forEach((transaction) => {
    const amounts = getTransactionAmounts(transaction);
    totalDebit += amounts.debit;
    totalCredit += amounts.credit;
    if (amounts.balance != null) closingBalance = amounts.balance;
  });

  return { totalCredit, totalDebit, closingBalance };
};

function getAuthHeaders() {
  try {
    const raw = localStorage.getItem('ooms_user_data');
    const user = raw ? JSON.parse(raw) : {};
    const headers = { Accept: 'application/pdf,*/*' };
    if (user.token) {
      headers.Authorization = `Bearer ${user.token}`;
      headers.token = user.token;
    }
    if (user.username) headers.username = user.username;
    if (user.country_code) headers.countrycode = user.country_code;
    if (user.mobile) headers.mobile = user.mobile;
    const branchId = user.branch?.branch_id || user.branch_id;
    if (branchId) {
      headers.branch = String(branchId);
      headers.branch_id = String(branchId);
    }
    return headers;
  } catch {
    return {};
  }
}

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

export default function Ledger() {
  const { userData } = useAuth();
  const caUsername = userData?.username || '';
  const caName = userData?.name || '';
  const caEmail = userData?.email || '';
  const caMobile = userData?.mobile || '';
  const caCountryCode = userData?.country_code || '91';

  const { pagination, updatePagination, goToPage } = usePagination(1, 20);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingTransactions, setFetchingTransactions] = useState(false);
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return toIsoDate(date);
  });
  const [toDate, setToDate] = useState(() => toIsoDate(new Date()));
  const [openingBalance, setOpeningBalance] = useState({ debit: 0, credit: 0, balance: 0 });
  const [summary, setSummary] = useState({
    totalCredit: 0,
    totalDebit: 0,
    closingBalance: 0,
  });
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState(null);
  const actionAnchorRef = useRef(null);
  const [downloadingLedger, setDownloadingLedger] = useState(false);
  const [detailsTransaction, setDetailsTransaction] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!caUsername || !fromDate || !toDate) return;

    setFetchingTransactions(true);
    try {
      const endpoint = `/transaction/list?page_no=${pagination.page}&limit=${pagination.limit}&from_date=${fromDate}&to_date=${toDate}`;
      const response = await apiCall(endpoint, 'GET');
      const data = await response.json();

      if (response.ok && data.success !== false) {
        const openingBalObj = normalizeOpeningBalance(data.opening_balance);
        const rows = data.data || [];
        setTransactions(rows);
        setOpeningBalance(openingBalObj);
        setSummary(calculateSummary(rows, openingBalObj));

        const total = data.pagination?.total ?? data.meta?.total ?? 0;
        updatePagination({ total });
      } else {
        throw new Error(data.message || 'Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Error fetching CA ledger:', error);
      toast.error(error.message || 'Failed to fetch transactions');
      setTransactions([]);
      const emptyOpening = { debit: 0, credit: 0, balance: 0 };
      setOpeningBalance(emptyOpening);
      setSummary(calculateSummary([], emptyOpening));
      updatePagination({ total: 0 });
    } finally {
      setFetchingTransactions(false);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caUsername, fromDate, toDate, pagination.page, pagination.limit]);

  useEffect(() => {
    goToPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, pagination.limit]);

  useEffect(() => {
    if (caUsername && fromDate && toDate) {
      fetchTransactions();
    }
  }, [caUsername, fromDate, toDate, fetchTransactions]);

  const handleRefresh = useCallback(() => {
    fetchTransactions();
    toast.success('Data refreshed');
  }, [fetchTransactions]);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowActionMenu(null);
      actionAnchorRef.current = null;
      setActionMenuPosition(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const computeActionMenuPosition = useCallback((anchorEl, itemCount = 2) => {
    if (!anchorEl) return null;

    const rect = anchorEl.getBoundingClientRect();
    const menuWidth = 160;
    const menuHeight = 8 + itemCount * 36;
    const gap = 8;
    const margin = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const space = {
      top: rect.top - margin,
      bottom: vh - rect.bottom - margin,
      right: vw - rect.right - margin,
      left: rect.left - margin,
    };

    const fits = {
      top: space.top >= menuHeight + gap,
      bottom: space.bottom >= menuHeight + gap,
      right: space.right >= menuWidth + gap,
      left: space.left >= menuWidth + gap,
    };

    const preferred = ['top', 'bottom', 'right', 'left'];
    let placement = preferred.find((p) => fits[p]);
    if (!placement) {
      placement = preferred.reduce((best, p) => (space[p] > space[best] ? p : best), 'bottom');
    }

    let top = 0;
    let left = 0;

    if (placement === 'top') {
      top = rect.top - menuHeight - gap;
      left = rect.left + rect.width / 2 - menuWidth / 2;
    } else if (placement === 'bottom') {
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2 - menuWidth / 2;
    } else if (placement === 'right') {
      top = rect.top + rect.height / 2 - menuHeight / 2;
      left = rect.right + gap;
    } else {
      top = rect.top + rect.height / 2 - menuHeight / 2;
      left = rect.left - menuWidth - gap;
    }

    const clampedLeft = Math.max(margin, Math.min(left, vw - menuWidth - margin));
    const clampedTop = Math.max(margin, Math.min(top, vh - menuHeight - margin));
    const anchorCenterX = rect.left + rect.width / 2;
    const anchorCenterY = rect.top + rect.height / 2;

    return {
      top: clampedTop,
      left: clampedLeft,
      placement,
      arrowX: Math.max(12, Math.min(menuWidth - 12, anchorCenterX - clampedLeft)),
      arrowY: Math.max(12, Math.min(menuHeight - 12, anchorCenterY - clampedTop)),
    };
  }, []);

  useEffect(() => {
    if (!showActionMenu || !actionAnchorRef.current) return undefined;

    const updatePosition = () => {
      const txn = transactions.find((t) => t.transaction_id === showActionMenu);
      const itemCount = 1 + (txn?.downloadable || txn?.invoice_id ? 1 : 0);
      setActionMenuPosition(computeActionMenuPosition(actionAnchorRef.current, itemCount));
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowActionMenu(null);
        actionAnchorRef.current = null;
        setActionMenuPosition(null);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    document.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showActionMenu, computeActionMenuPosition, transactions]);

  const handleDownloadLedgerPdf = useCallback(async () => {
    if (!caUsername) return;
    if (!fromDate || !toDate) {
      toast.error('Please select a date range');
      return;
    }

    setDownloadingLedger(true);
    const toastId = toast.loading('Generating ledger PDF…');
    try {
      const params = new URLSearchParams({
        from_date: fromDate,
        to_date: toDate,
        format: 'pdf',
      });
      const response = await fetch(`${API_BASE}/transaction/download/ledger?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        let message = 'Failed to download ledger';
        try {
          const err = await response.json();
          message = err.message || message;
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const filename = buildLedgerDownloadFilename({
        name: caName || caUsername,
        fromDate,
        toDate,
        extension: 'pdf',
      });
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Ledger downloaded', { id: toastId });
    } catch (error) {
      console.error('Ledger download error:', error);
      toast.error(error.message || 'Failed to download ledger', { id: toastId });
    } finally {
      setDownloadingLedger(false);
    }
  }, [caUsername, caName, fromDate, toDate]);

  const handleActionClick = (e, transactionId) => {
    e.stopPropagation();
    const willOpen = showActionMenu !== transactionId;
    if (willOpen) {
      const txn = transactions.find((t) => t.transaction_id === transactionId);
      const itemCount = 1 + (txn?.downloadable || txn?.invoice_id ? 1 : 0);
      actionAnchorRef.current = e.currentTarget;
      setShowActionMenu(transactionId);
      setActionMenuPosition(computeActionMenuPosition(e.currentTarget, itemCount));
      return;
    }
    actionAnchorRef.current = null;
    setShowActionMenu(null);
    setActionMenuPosition(null);
  };

  const handleViewDetails = (transaction) => {
    setDetailsTransaction(transaction);
    setShowActionMenu(null);
    actionAnchorRef.current = null;
    setActionMenuPosition(null);
  };

  const handleViewInvoice = async (transaction) => {
    if (!transaction?.invoice_id) {
      toast.error('Invoice ID not available for this transaction');
      return;
    }

    setShowActionMenu(null);
    actionAnchorRef.current = null;
    setActionMenuPosition(null);
    setDownloadingInvoice(true);

    const toastId = toast.loading('Generating invoice…');
    try {
      const response = await apiCall('/transaction/generate-invoice', 'POST', {
        invoice_id: transaction.invoice_id,
        type: String(transaction.transaction_type || '').toLowerCase(),
      });
      const resData = await response.json();
      if (response.ok && resData.success && resData.data?.url) {
        toast.success(resData.message || 'Invoice generated', { id: toastId });
        await downloadFromUrl(
          resData.data.url,
          resData.data.suggested_filename || resData.data.filename || 'invoice.pdf'
        );
      } else {
        toast.error(resData.message || 'Failed to download invoice', { id: toastId });
      }
    } catch (error) {
      toast.error(error.message || 'Failed to download invoice', { id: toastId });
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const selectedActionTransaction = useMemo(
    () => transactions.find((t) => t.transaction_id === showActionMenu),
    [transactions, showActionMenu]
  );

  const subtitleParts = [
    caName,
    caEmail,
    caMobile ? `+${caCountryCode || '91'} ${caMobile}` : null,
  ].filter(Boolean);

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 rounded-2xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4 shadow-sm"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-800 dark:text-gray-100 sm:text-lg">CA Ledger</h2>
            {subtitleParts.length > 0 && (
              <p className="mt-1 truncate text-sm text-slate-500 dark:text-gray-400">
                {subtitleParts.join(' · ')}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="w-56 shrink-0">
              <DateRangePickerField
                value={{ start: fromDate, end: toDate }}
                onChange={(range) => {
                  setFromDate(range?.start || '');
                  setToDate(range?.end || '');
                }}
                placeholder="Select date range"
                mode="range"
                initialTab="quick"
                defaultQuickKey="tm"
                quickOptionKeys={['tw', 'lw', 'lm', 'tm', 'lf', 'fy']}
                showRangeHint={false}
                showResetButton={false}
                buttonClassName="w-full rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3.5 py-2 text-sm text-slate-600 dark:text-gray-200 transition-all hover:border-indigo-400 focus:outline-none"
                wrapperClassName="w-full"
              />
            </div>
            <motion.button
              type="button"
              onClick={handleRefresh}
              className="rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-2 shadow-sm transition-all duration-200 hover:shadow"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Refresh"
            >
              <FiRefreshCw
                className={`h-5 w-5 text-slate-600 dark:text-gray-300 ${fetchingTransactions ? 'animate-spin' : ''}`}
              />
            </motion.button>
            <motion.button
              type="button"
              onClick={handleDownloadLedgerPdf}
              disabled={downloadingLedger}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-gray-200 shadow-sm transition-all duration-200 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title="Download ledger PDF"
            >
              {downloadingLedger ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
              ) : (
                <FiDownload className="h-4 w-4 text-slate-600 dark:text-gray-300" />
              )}
              <span>Download</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="overflow-hidden rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg"
      >
        <TransactionTable
          transactions={transactions}
          loading={loading}
          fetching={fetchingTransactions}
          openingBalance={openingBalance}
          summary={summary}
          currentPage={pagination.page}
          itemsPerPage={pagination.limit}
          onActionClick={handleActionClick}
        />

        <TablePagination
          page={pagination.page}
          limit={pagination.limit}
          total={pagination.total}
          totalPages={pagination.total_pages}
          isLastPage={pagination.is_last_page}
          rowOptions={[5, 10, 20, 50, 100]}
          defaultRows={20}
          onPageChange={goToPage}
          onLimitChange={(l) => { updatePagination({ limit: l, page: 1 }); }}
        />
      </motion.div>

      <AnimatePresence>
        {detailsTransaction && (
          <ViewTransactionModalManager
            transaction={detailsTransaction}
            onClose={() => setDetailsTransaction(null)}
            formatCurrency={formatLedgerCurrency}
            onDownload={handleViewInvoice}
            isDownloading={downloadingInvoice}
          />
        )}
      </AnimatePresence>

      {showActionMenu &&
        selectedActionTransaction &&
        actionMenuPosition &&
        createPortal(
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed z-[99999] w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
            style={{ top: actionMenuPosition.top, left: actionMenuPosition.left, height: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => handleViewDetails(selectedActionTransaction)}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-indigo-50"
            >
              <FiEye className="h-4 w-4 text-indigo-600" />
              Details
            </button>
            {(selectedActionTransaction.downloadable || selectedActionTransaction.invoice_id) ? (
              <button
                type="button"
                onClick={() => handleViewInvoice(selectedActionTransaction)}
                disabled={downloadingInvoice}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {downloadingInvoice ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
                ) : (
                  <FiFile className="h-4 w-4 text-green-600" />
                )}
                {downloadingInvoice ? 'Downloading…' : 'Download'}
              </button>
            ) : null}
          </motion.div>,
          document.body
        )}
    </div>
  );
}
