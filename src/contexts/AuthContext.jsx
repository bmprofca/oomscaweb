import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/apiCall';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function buildSession(token, branchProfile, authMeta = {}) {
  return {
    token,
    ...branchProfile,
    ...authMeta,
    username: branchProfile?.username,
    branch: {
      branch_id: branchProfile?.branch?.branch_id || branchProfile?.branch_id || null,
      name: branchProfile?.branch?.name || null,
      logo: branchProfile?.branch?.logo || null,
    },
  };
}

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(() => {
    try {
      const stored = localStorage.getItem('ooms_user_data');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const navigate = useNavigate();

  const login = (token, branchProfile, authMeta = {}) => {
    const newData = buildSession(token, branchProfile, authMeta);
    setUserData(newData);
    localStorage.setItem('ooms_user_data', JSON.stringify(newData));
    navigate('/dashboard');
  };

  /**
   * Switch active branch assignment.
   * Persists locally, then hard-refreshes into dashboard so all pages reload branch data.
   */
  const switchBranch = (branchProfile) => {
    if (!userData?.token || !branchProfile?.branch?.branch_id) {
      return;
    }

    const newData = buildSession(userData.token, branchProfile, {
      country_code: userData.country_code,
      mobile: userData.mobile,
    });

    localStorage.setItem('ooms_user_data', JSON.stringify(newData));
    setUserData(newData);
    setIsProfileModalOpen(false);
    window.location.href = '/dashboard';
  };

  // Backward-compatible alias used by older components
  const updateProfile = (branchProfile) => {
    switchBranch(branchProfile);
  };

  const logout = async () => {
    try {
      await apiCall('/auth/logout', 'POST');
    } catch {
      // Clear local session even if logout API fails
    }
    setUserData(null);
    localStorage.removeItem('ooms_user_data');
    navigate('/login');
  };

  const openProfileModal = () => setIsProfileModalOpen(true);
  const closeProfileModal = () => setIsProfileModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        userData,
        login,
        logout,
        switchBranch,
        updateProfile,
        isProfileModalOpen,
        openProfileModal,
        closeProfileModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
