/**
 * Same contract as CLIENT `utils/onesaas-upload.js`:
 * POST https://upload.onesaas.in/api/upload with header key=onedevelopers
 */

export const ONESAAS_UPLOAD_URL =
  process.env.REACT_APP_ONESAAS_UPLOAD_URL || 'https://upload.onesaas.in/api/upload';
export const ONESAAS_UPLOAD_KEY =
  process.env.REACT_APP_ONESAAS_UPLOAD_KEY || 'onedevelopers';

export class UploadAbortedError extends Error {
  constructor(message = 'Upload cancelled') {
    super(message);
    this.name = 'UploadAbortedError';
    this.code = 'ABORTED';
  }
}

/**
 * Upload a file to OneSaaS public storage.
 * Returns a promise with `.abort()` to cancel the in-flight XHR.
 * @param {File} file
 * @param {(pct: number) => void} [onProgress]
 * @returns {Promise<{ url: string, meta: object|null }> & { abort: () => void }}
 */
export const uploadOneSaasFile = (file, onProgress) => {
  let xhr = null;

  const promise = new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file selected'));
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    xhr = new XMLHttpRequest();
    xhr.open('POST', ONESAAS_UPLOAD_URL);
    xhr.setRequestHeader('key', ONESAAS_UPLOAD_KEY);
    xhr.timeout = 120000;

    if (typeof onProgress === 'function') {
      xhr.upload.onprogress = (event) => {
        const total = event.total || file.size || 1;
        onProgress(Math.min(100, Math.round((event.loaded * 100) / total)));
      };
    }

    xhr.onload = () => {
      let data = null;
      try {
        data = JSON.parse(xhr.responseText || '{}');
      } catch {
        reject(new Error('Invalid upload response'));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300 && data?.success && data?.url) {
        resolve({ url: data.url, meta: data.meta || null });
        return;
      }
      reject(new Error(data?.message || `Upload failed (${xhr.status})`));
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.ontimeout = () => reject(new Error('Upload timed out'));
    xhr.onabort = () => reject(new UploadAbortedError());
    xhr.send(formData);
  });

  promise.abort = () => {
    if (xhr && xhr.readyState !== XMLHttpRequest.DONE) {
      xhr.abort();
    }
  };

  return promise;
};

/** Convenience helper — returns only the public file URL. */
export const uploadOneSaasFileUrl = async (file, onProgress) => {
  const { url } = await uploadOneSaasFile(file, onProgress);
  return url;
};
