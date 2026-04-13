import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.warn('VITE_API_URL is not set in production. API calls will use same-origin /api.');
}

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    // Prevent browser cached 304 responses for API calls
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  },
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('canteen_user_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 → clear session and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('canteen_user_token');
      localStorage.removeItem('canteen_user_data');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
