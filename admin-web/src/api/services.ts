import api from './axiosInstance';
import {
  Category,
  Item,
  Order,
  OrderStats,
  SiteBrandingSettings,
  UpiQrSettings,
  User,
} from '../types';

// Auth
export const loginAdmin = (data: { email: string; password: string }) =>
  api.post<{ data: { user: User; token: string } }>('/auth/login', data);

// Categories
export const fetchCategories = () =>
  api.get<{ data: Category[] }>('/categories?all=true');

export const createCategory = (data: FormData) =>
  api.post<{ data: Category }>('/categories', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateCategory = (id: string, data: FormData) =>
  api.put<{ data: Category }>(`/categories/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const deleteCategory = (id: string) =>
  api.delete(`/categories/${id}`);

// Items
export const fetchItems = (params?: { category_id?: string; search?: string }) =>
  api.get<{ data: Item[] }>('/items?all=true', { params });

export const createItem = (data: FormData) =>
  api.post<{ data: Item }>('/items', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateItem = (id: string, data: FormData) =>
  api.put<{ data: Item }>(`/items/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const deleteItem = (id: string) => api.delete(`/items/${id}`);

// Orders
export const fetchOrders = (status?: string) =>
  api.get<{ data: Order[] }>('/orders', { params: status ? { status } : {} });

export const fetchOrderStats = () =>
  api.get<{ data: OrderStats }>('/orders/stats');

export const updateOrderStatus = (id: string, status: string) =>
  api.patch<{ data: Order }>(`/orders/${id}/status`, { status });

// Users
export const fetchUsers = () => api.get<{ data: User[] }>('/users');

export const toggleUserStatus = (id: string, is_active: boolean) =>
  api.patch(`/users/${id}/status`, { is_active });

// Settings
export const fetchUpiQrSettings = () =>
  api.get<{ data: UpiQrSettings | null }>('/settings/public/upi-qr');

export const saveUpiQrSettings = (body: UpiQrSettings) =>
  api.put<{ data: UpiQrSettings }>('/settings/upi-qr', body);

export const fetchPublicSiteBranding = () =>
  api.get<{ data: SiteBrandingSettings }>('/settings/public/branding');

export const saveSiteBranding = (data: FormData) =>
  api.put<{ data: SiteBrandingSettings }>('/settings/branding', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const changeAdminPassword = (body: {
  current_password: string;
  new_password: string;
  confirm_password: string;
}) => api.put('/settings/change-password', body);
