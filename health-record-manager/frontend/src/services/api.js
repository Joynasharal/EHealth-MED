import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
});

// Auth routes handle their own errors via inline messages — don't auto-toast them
const AUTH_ROUTES = ['/auth/login', '/auth/signup', '/auth/google', '/auth/forgot-password', '/auth/verify-otp', '/auth/reset-password'];
const isAuthRoute = (url = '') => AUTH_ROUTES.some((r) => url.includes(r));

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hrm_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || 'Something went wrong';
    const url = error.config?.url || '';

    if (status === 401 && !isAuthRoute(url)) {
      // Session expired — redirect to login
      localStorage.removeItem('hrm_token');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Don't auto-toast for auth routes (they show inline errors)
    // Don't auto-toast for 404s (handled per-page)
    if (!isAuthRoute(url) && status !== 404) {
      toast.error(message, { duration: 5000 });
    }

    return Promise.reject(error);
  }
);

export default api;
