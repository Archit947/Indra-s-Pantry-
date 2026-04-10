// ─── Shared domain types ────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  password_hash: string;
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
  categories?: Category;
}

export interface CartItem {
  id: string;
  user_id: string;
  item_id: string;
  quantity: number;
  created_at: string;
  items?: Item;
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

export type PaymentMethod = 'cash_at_pickup' | 'cash_on_delivery' | 'upi';

export interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  total_amount: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  notes?: string;
  created_at: string;
  updated_at: string;
  users?: Pick<User, 'id' | 'email' | 'name' | 'phone'>;
}

// ─── Express request augmentation ───────────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'user' | 'admin';
      };
    }
  }
}
