export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface Item {
  id: string;
  category_id?: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  categories?: { id: string; name: string };
}

export interface OrderItem {
  item_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

export type OrderStatus =
  | 'placed'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  total_amount: number;
  status: OrderStatus;
  payment_method: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  users?: { id: string; name: string; email: string; phone?: string };
}

export interface OrderStats {
  total: number;
  placed: number;
  accepted: number;
  preparing: number;
  ready: number;
  completed: number;
  cancelled: number;
  totalRevenue: number;
}

export interface UpiQrSettings {
  qr_image_url: string;
  upi_id?: string;
  merchant_name?: string;
}

export interface SiteBrandingSettings {
  site_name: string;
  logo_url?: string;
}
