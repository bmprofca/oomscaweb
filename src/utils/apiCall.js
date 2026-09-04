import toast from 'react-hot-toast';

// BASE_API_URL — set via REACT_APP_BASE_API_URL in .env.development / .env.production
const API_BASE = (process.env.REACT_APP_BASE_API_URL || 'http://localhost:8877/ca').replace(/\/$/, '');

function clearSessionAndRedirectToLogin() {
  localStorage.removeItem('ooms_user_data');
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

/**
 * Unified API calling utility
 * @param {string} endpoint - The API endpoint or full URL
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param {Object|null} body - Request payload
 * @returns {Promise<Response>} - The fetch response object
 */
export const apiCall = async (endpoint, method = 'GET', body = null) => {
  const userDataStr = localStorage.getItem('ooms_user_data');
  let token = null;
  let username = null;
  let mobile = null;
  let countrycode = null;
  let branchId = null;

  if (userDataStr) {
    try {
      const userData = JSON.parse(userDataStr);
      token = userData.token;
      username = userData.username;
      mobile = userData.mobile;
      countrycode = userData.country_code;
      branchId = userData.branch?.branch_id || userData.branch_id || null;
    } catch (e) {
      console.error('Failed to parse ooms_user_data from local storage', e);
    }
  }

  const headers = {};

  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['token'] = token;
  }

  if (username) {
    headers['username'] = username;
  }

  if (countrycode) {
    headers['countrycode'] = countrycode;
  }

  if (mobile) {
    headers['mobile'] = mobile;
  }

  if (branchId) {
    headers['branch'] = String(branchId);
    headers['branch_id'] = String(branchId);
  }

  const options = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
    if (body instanceof FormData) {
      options.body = body;
    } else {
      options.body = JSON.stringify(body);
    }
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, options);

    // Any auth / assignment failure → force re-login
    if (response.status === 401 || response.status === 403) {
      clearSessionAndRedirectToLogin();
    }

    try {
      const clonedResponse = response.clone();
      const data = await clonedResponse.json();

      if (data && data.message) {
        if (!response.ok || data.success === false) {
          toast.error(data.message);
        }
      }
    } catch (e) {
      // Ignored
    }

    return response;
  } catch (error) {
    console.error(`API Call Error (${url}):`, error);
    toast.error(error.message || 'Network error or server unreachable');
    throw error;
  }
};

/**
 * Common file upload utility (same OneSaaS endpoint as CLIENT).
 * @param {File} file - The file to upload
 * @param {(pct: number) => void} [onProgress]
 * @returns {Promise<string>} - The URL of the uploaded file
 */
export { uploadOneSaasFileUrl as uploadFile } from './onesaas-upload';

export default apiCall;
