// src/api/axios.ts
import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/.netlify/functions',
  withCredentials: true,
});

// Request interceptor – could add additional headers if needed
api.interceptors.request.use(
  (config) => config,
  (error) => {
    toast.error('Request error');
    return Promise.reject(error);
  }
);

// Response interceptor – handle auth errors and auto‑retry for transient failures
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    if (!config || !response) {
      toast.error('Network error');
      return Promise.reject(error);
    }
    // 401 – unauthorized, redirect to login page
    if (response.status === 401) {
      // optional: clear auth state here
      toast.error('Session expired, please log in again');
      // could trigger a global logout
    }
    // Retry logic for 429 (Too Many Requests) or 5xx errors
    const retryStatus = [429, 502, 503, 504];
    if (retryStatus.includes(response.status) && config.__retryCount < 3) {
      config.__retryCount = (config.__retryCount || 0) + 1;
      const delay = Math.pow(2, config.__retryCount) * 1000; // exponential backoff
      await new Promise((res) => setTimeout(res, delay));
      return api(config);
    }
    // Show generic error toast
    const message = response.data?.error || response.statusText || 'Something went wrong';
    toast.error(message);
    return Promise.reject(error);
  }
);

export default api;
