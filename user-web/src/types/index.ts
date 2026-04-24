export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'user' | 'admin';
  is_active?: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
}

export interface Item {
  id: string;
  category_id?: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  stock: number;
  is_available: boolean;
  categories?: { id: string; name: string; description?: string };
}

export interface CartItem {
  id: string;
  user_id: string;
  item_id: string;
  quantity: number;
  items?: Item;
}

export interface OrderItem {
  item_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  category_name?: string;
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
}

export interface SiteBrandingSettings {
  site_name: string;
  logo_url?: string;
}
