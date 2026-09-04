import React, { useState, useEffect, useCallback } from 'react';
import {
  User, Phone, Building2, Mail, Hash, Wallet, MapPin, IndianRupee,
} from 'lucide-react';
import ManagementHub from '../components/common/ManagementHub';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

export default function Profile() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiCall('/profile/me', 'GET');
      const data = await res.json();
      if (res.ok && data.success !== false && data.data) {
        setProfile(data.data);
      } else {
        toast.error(data.message || 'Failed to load profile');
        if (userData) {
          setProfile({
            username: userData.username,
            name: userData.name,
            email: userData.email,
            mobile: userData.mobile,
            country_code: userData.country_code,
            branch: userData.branch,
            balance: null,
            address: null,
          });
        }
      }
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [userData]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const SectionHeader = ({ icon: Icon, title }) => (
    <div className="px-6 py-5 border-b border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-800/40">
      <div className="p-2 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/30 text-white">
        <Icon size={18} className="stroke-[2.5]" />
      </div>
      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base tracking-tight">{title}</h3>
    </div>
  );

  const FieldLabel = ({ children }) => (
    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
      {children}
    </label>
  );

  const FieldValue = ({ children }) => (
    <p className="text-sm text-slate-900 dark:text-white font-medium">{children || '—'}</p>
  );

  if (loading) {
    return (
      <ManagementHub title="CA Profile" description="Your profile, branch, and balance." accent="blue">
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-6">
          <div className="h-72 rounded-md bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-72 rounded-md bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
      </ManagementHub>
    );
  }

  const p = profile || {};
  const addressLine = p.address
    ? [p.address.address_line_1, p.address.address_line_2, p.address.city, p.address.district, p.address.state, p.address.pincode]
        .filter(Boolean)
        .join(', ')
    : '';

  return (
    <ManagementHub
      title="CA Profile"
      description="Your profile, branch, and account balance."
      accent="blue"
      onRefresh={fetchProfile}
      refreshing={loading}
      refreshLabel="Refresh"
    >
      <div className="mt-8 flex flex-col lg:flex-row gap-8 items-start w-full">
        <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-6">
          <div className="bg-white/60 dark:bg-slate-800/60 rounded-sm shadow-sm border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-xl overflow-hidden w-full">
            <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600 w-full" />
            <div className="flex flex-col items-center px-6 pb-6 -mt-12 relative z-10">
              <div className="relative w-24 h-24 rounded-sm ring-4 ring-white dark:ring-slate-900 shadow-xl mb-4 bg-white dark:bg-slate-800">
                <div className="w-full h-full rounded-sm bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center">
                  <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                    {(p.name || 'C').charAt(0)}
                  </span>
                </div>
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white text-center leading-tight tracking-tight">{p.name || 'CA'}</h2>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center mt-1 truncate w-full">{p.email}</p>
              <span className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                Chartered Accountant
              </span>
              <div className="mt-6 w-full space-y-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                {p.email && (
                  <div className="flex items-center gap-3 bg-slate-50/80 dark:bg-slate-900/40 rounded-xl px-4 py-2.5 w-full border border-slate-100 dark:border-slate-800">
                    <Mail size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate">{p.email}</span>
                  </div>
                )}
                {p.mobile && (
                  <div className="flex items-center gap-3 bg-slate-50/80 dark:bg-slate-900/40 rounded-xl px-4 py-2.5 w-full border border-slate-100 dark:border-slate-800">
                    <Phone size={14} className="text-slate-400 shrink-0" />
                    <span>+{p.country_code || '91'} {p.mobile}</span>
                  </div>
                )}
                {p.branch?.name && (
                  <div className="flex items-center gap-3 bg-slate-50/80 dark:bg-slate-900/40 rounded-xl px-4 py-2.5 w-full border border-slate-100 dark:border-slate-800">
                    <Building2 size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate">{p.branch.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col gap-6 w-full">
          <div className="bg-white/60 dark:bg-slate-800/60 rounded-sm shadow-sm border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-xl overflow-hidden w-full">
            <SectionHeader icon={User} title="CA Information" />
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <FieldLabel>Username</FieldLabel>
                <FieldValue>{p.username}</FieldValue>
              </div>
              <div>
                <FieldLabel>Full Name</FieldLabel>
                <FieldValue>{p.name}</FieldValue>
              </div>
              <div>
                <FieldLabel>Email Address</FieldLabel>
                <FieldValue>{p.email}</FieldValue>
              </div>
              <div>
                <FieldLabel>Mobile Number</FieldLabel>
                <FieldValue>+{p.country_code || '91'} {p.mobile}</FieldValue>
              </div>
            </div>
          </div>

          <div className="bg-white/60 dark:bg-slate-800/60 rounded-sm shadow-sm border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-xl overflow-hidden w-full">
            <SectionHeader icon={Building2} title="Branch Details" />
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <FieldLabel>Branch Name</FieldLabel>
                <FieldValue>{p.branch?.name}</FieldValue>
              </div>
              <div>
                <FieldLabel>Branch ID</FieldLabel>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg font-mono text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  <Hash size={13} className="text-slate-500" />
                  {p.branch?.branch_id || '—'}
                </span>
              </div>
            </div>
          </div>

          {p.balance && (
            <div className="bg-white/60 dark:bg-slate-800/60 rounded-sm shadow-sm border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-xl overflow-hidden w-full">
              <SectionHeader icon={Wallet} title="Account Balance" />
              <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <FieldLabel>Net Balance</FieldLabel>
                  <p className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-0.5">
                    <IndianRupee size={16} className="text-slate-400" />{fmt(p.balance.balance)}
                  </p>
                </div>
                <div>
                  <FieldLabel>Credit</FieldLabel>
                  <FieldValue>₹{fmt(p.balance.credit)}</FieldValue>
                </div>
                <div>
                  <FieldLabel>Debit</FieldLabel>
                  <FieldValue>₹{fmt(p.balance.debit)}</FieldValue>
                </div>
              </div>
            </div>
          )}

          {addressLine && (
            <div className="bg-white/60 dark:bg-slate-800/60 rounded-sm shadow-sm border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-xl overflow-hidden w-full">
              <SectionHeader icon={MapPin} title="Address" />
              <div className="p-6">
                <FieldValue>{addressLine}</FieldValue>
              </div>
            </div>
          )}
        </div>
      </div>
    </ManagementHub>
  );
}
