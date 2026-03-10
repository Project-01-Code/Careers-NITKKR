import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor — auto-refresh on 401
let isRefreshing = false;
let failedQueue = [];

// eslint-disable-next-line no-unused-vars
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Network error handling
    if (!navigator.onLine) {
      toast.error('No internet connection. Please check your network and try again.');
      return Promise.reject(error);
    }

    // Server unavailable
    if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      toast.error('Unable to connect to server. Please try again later.');
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh-token')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post('/auth/refresh-token');
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Only redirect to login if the user was trying to access a protected resource 
        // and is not already on an auth page, to prevent infinite loops on mount.
        if (
          !originalRequest.url.includes('/auth/profile') &&
          !window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/register')
        ) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
