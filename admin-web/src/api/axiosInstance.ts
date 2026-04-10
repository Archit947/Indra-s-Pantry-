import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach JWT token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('canteen_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If 401 — clear storage and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('canteen_admin_token');
      localStorage.removeItem('canteen_admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
