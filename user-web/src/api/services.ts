import api from './axiosInstance';
import { Item, Category, Order, User } from '../types';

// ── Auth ──────────────────────────────────────────────────────
export const loginUser = (email: string, password: string) =>
  api.post<{ data: { user: User; token: string } }>('/auth/login', { email, password });

export const registerUser = (body: { email: string; password: string; name: string; phone?: string }) =>
  api.post<{ data: { user: User; token: string } }>('/auth/register', body);

export const getMe = () => api.get<{ data: User }>('/auth/me');

export const updateProfile = (body: { name?: string; phone?: string }) =>
  api.put<{ data: User }>('/users/profile', body);

// ── Items ──────────────────────────────────────────────────────
export const fetchItems = (params?: { category_id?: string; search?: string }) =>
  api.get<{ data: Item[] }>('/items', { params });

export const fetchItemById = (id: string) =>
  api.get<{ data: Item }>(`/items/${id}`);

// ── Categories ──────────────────────────────────────────────────
export const fetchCategories = () =>
  api.get<{ data: Category[] }>('/categories');

// ── Cart ────────────────────────────────────────────────────────
export const getCart = () => {
  // Append a timestamp to prevent cached 304 responses from returning empty bodies
  return api.get<{ data: any[] }>('/cart', { params: { t: Date.now() } });
};

export const addToCart = (item_id: string, quantity: number) =>
  api.post('/cart', { item_id, quantity });

export const updateCartItem = (id: string, quantity: number) =>
  api.put(`/cart/${id}`, { quantity });

export const removeFromCart = (id: string) =>
  api.delete(`/cart/${id}`);

export const clearCartApi = () =>
  api.delete('/cart/clear');

// ── Orders ──────────────────────────────────────────────────────
export const placeOrder = (body: { payment_method: string; notes?: string }) =>
  api.post<{ data: Order }>('/orders', body);

export const getMyOrders = () =>
  api.get<{ data: Order[] }>('/orders/my');

export const getOrderById = (id: string) =>
  api.get<{ data: Order }>(`/orders/${id}`);

// ── Public Settings ───────────────────────────────────────────
export const getPublicUpiQrSettings = () =>
  api.get<{ data: { qr_image_url: string; upi_id?: string; merchant_name?: string } | null }>('/settings/public/upi-qr');
