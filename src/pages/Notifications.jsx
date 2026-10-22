import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Bell, CheckCheck, RefreshCw, Trash2 } from 'lucide-react';
import { apiCall } from '../utils/apiCall';
import { normalizeNotification } from '../utils/notification-utils';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [listResponse, countResponse] = await Promise.all([apiCall('/notifications?limit=100&include_read=true', 'GET'), apiCall('/notifications/unread-count', 'GET')]);
      const list = await listResponse.json().catch(() => null);
      const count = await countResponse.json().catch(() => null);
      if (!listResponse.ok || list?.success === false) throw new Error(list?.message || 'Unable to load notifications');
      setItems(Array.isArray(list?.data) ? list.data.map(normalizeNotification) : []);
      setUnread(Number(count?.data?.unread_count || 0));
    } catch (requestError) { setItems([]); setError(requestError.message || 'Unable to load notifications'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const changeState = async (path, body, update) => {
    setBusy(true);
    try {
      const response = await apiCall(path, 'POST', body);
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.success === false) throw new Error(payload?.message || 'Notification action failed');
      update();
    } catch (requestError) { setError(requestError.message || 'Notification action failed'); }
    finally { setBusy(false); }
  };

  return <div className="mx-auto max-w-5xl space-y-4">
    <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div><p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">CA workspace</p><h1 className="text-xl font-bold text-slate-900 dark:text-white">Notifications</h1><p className="text-sm text-slate-500 dark:text-slate-400">Updates for your assigned offices and review work.</p></div><div className="flex items-center gap-2"><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">{unread} unread</span><button type="button" onClick={() => changeState('/notifications/read', { mark_all: true }, () => { setItems(current => current.map(item => ({ ...item, isRead: true }))); setUnread(0); })} disabled={busy || unread === 0} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"><CheckCheck size={14} /> Mark all read</button><button type="button" onClick={load} className="rounded-md border border-slate-200 p-2 text-slate-500 dark:border-slate-700 dark:text-slate-300" aria-label="Refresh notifications"><RefreshCw size={15} /></button></div></div>
    {error && <div role="alert" className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300"><AlertCircle size={16} />{error}<button type="button" onClick={load} className="ml-auto font-semibold hover:underline">Retry</button></div>}
    {loading ? <div className="rounded-md border border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800">Loading notifications…</div> : items.length === 0 ? <div className="rounded-md border border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800">No notifications found.</div> : <div className="space-y-2">{items.map(item => <article key={item.id} className={`flex items-start gap-3 rounded-md border p-4 ${item.isRead ? 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900' : 'border-indigo-200 bg-indigo-50/50 dark:border-indigo-900/50 dark:bg-indigo-950/20'}`}><Bell className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h2><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">{item.category}</span>{!item.isRead && <span className="text-[10px] font-bold uppercase text-indigo-600">Unread</span>}</div><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.body}</p><time className="mt-2 block text-xs text-slate-400">{item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN') : 'Date unavailable'}</time></div><div className="flex gap-1"><button type="button" disabled={busy || item.isRead} onClick={() => changeState('/notifications/read', { notification_ids: [item.id] }, () => { setItems(current => current.map(row => row.id === item.id ? { ...row, isRead: true } : row)); setUnread(current => Math.max(0, current - 1)); })} aria-label={`Mark ${item.title} read`} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-40"><CheckCheck size={15} /></button><button type="button" disabled={busy} onClick={() => changeState('/notifications/delete', { notification_ids: [item.id] }, () => { setItems(current => current.filter(row => row.id !== item.id)); if (!item.isRead) setUnread(current => Math.max(0, current - 1)); })} aria-label={`Delete ${item.title}`} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"><Trash2 size={15} /></button></div></article>)}</div>}
  </div>;
}
