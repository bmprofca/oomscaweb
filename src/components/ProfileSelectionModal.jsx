import React, { useCallback, useEffect, useState } from 'react';
import { Search, CheckCircle2, X, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/apiCall';

const ProfileSelectionModal = () => {
  const { isProfileModalOpen, closeProfileModal, switchBranch, userData } = useAuth();
  const [branches, setBranches] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const requiresSelection = Boolean(userData?.token && (!userData?.username || !userData?.branch?.branch_id));

  const handleSelect = useCallback((branchProfile) => {
    if (!branchProfile?.branch?.branch_id) return;
    // Hard refresh to dashboard happens inside switchBranch
    switchBranch(branchProfile);
  }, [switchBranch]);

  useEffect(() => {
    if (!isProfileModalOpen) return;

    const fetchBranches = async () => {
      try {
        const response = await apiCall('/profile/list', 'GET');
        const data = await response.json();
        const list = data.branches || data.data || [];

        if (response.ok && data.success !== false && list.length > 0) {
          setBranches(list);
          if (list.length === 1 && requiresSelection) {
            handleSelect(list[0]);
          }
        } else {
          setError('No branch assignments found for this CA.');
        }
      } catch (err) {
        setError('Network error while fetching branches.');
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    setError('');
    setSearchQuery('');
    fetchBranches();
  }, [isProfileModalOpen, handleSelect, requiresSelection]);

  if (!isProfileModalOpen) return null;

  const filteredBranches = branches.filter((b) => {
    const query = searchQuery.toLowerCase();
    const nameMatch = b.name?.toLowerCase().includes(query);
    const branchMatch = b.branch?.name?.toLowerCase().includes(query);
    const emailMatch = b.email?.toLowerCase().includes(query);
    const idMatch = String(b.branch?.branch_id || '').toLowerCase().includes(query);
    return nameMatch || branchMatch || emailMatch || idMatch;
  });

  const handleClose = () => {
    if (requiresSelection) return;
    closeProfileModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="bg-white dark:bg-gray-800 rounded-md shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-3xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{ animation: 'slideIn 0.3s ease', maxHeight: '85vh', height: '70vh' }}
      >
        <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 gap-4 shrink-0">
          <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Switch Branch</h2>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                {requiresSelection
                  ? 'Select a branch to continue'
                  : 'Choose another branch assignment'}
              </p>
            </div>
            {!requiresSelection && (
              <button
                onClick={handleClose}
                className="sm:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>

          <div className="relative w-full sm:max-w-xs md:max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search branches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
            />
          </div>

          {!requiresSelection && (
            <button
              onClick={handleClose}
              className="hidden sm:block text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-gray-800/50">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm border border-red-100">{error}</div>
          ) : filteredBranches.length === 0 ? (
            <div className="text-center py-10">
              <Building2 size={40} className="mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No branches found</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                We couldn&apos;t find any branches matching &quot;{searchQuery}&quot;
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredBranches.map((branchProfile, idx) => {
                const isActive = Boolean(
                  userData?.branch?.branch_id &&
                  userData.branch.branch_id === branchProfile.branch?.branch_id &&
                  userData.username === branchProfile.username
                );

                return (
                  <div
                    key={`${branchProfile.username}-${branchProfile.branch?.branch_id}-${idx}`}
                    onClick={() => !isActive && handleSelect(branchProfile)}
                    className={`p-4 border-[1.5px] rounded-md transition-all duration-200 flex flex-col gap-1.5 relative overflow-hidden group ${
                      isActive
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 dark:border-indigo-500/70 shadow-sm cursor-default'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer hover:border-slate-800 hover:shadow-md dark:hover:border-gray-500'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-4 right-4 text-indigo-600 dark:text-indigo-400">
                        <CheckCircle2 size={20} />
                      </div>
                    )}
                    <div className="pr-8">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {branchProfile.branch?.name || 'Unnamed branch'}
                      </h3>
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">
                        {branchProfile.name || branchProfile.username}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 truncate">
                        {branchProfile.email || branchProfile.username}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSelectionModal;
