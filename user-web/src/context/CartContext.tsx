import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { CartItem } from '../types';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCartApi,
} from '../api/services';
import { useAuth } from './AuthContext';

interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  cartCount: number;
  cartTotal: number;
  loadCart: () => Promise<void>;
  addItem: (item_id: string, quantity?: number) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, token } = useAuth();

  const loadCart = useCallback(async () => {
    // Allow loading immediately after login by checking localStorage for token
    const tokenInStorage = typeof window !== 'undefined' ? localStorage.getItem('canteen_user_token') : null;
    if (!isAuthenticated && !tokenInStorage) { 
      console.debug('[Cart] loadCart: Not authenticated, clearing cart');
      setCartItems([]); 
      return; 
    }
    try {
      console.debug('[Cart] loadCart: starting');
      setLoading(true);
      const res = await getCart();
      console.debug('[Cart] loadCart: response status', res.status);
      console.debug('[Cart] loadCart: response data', res.data);
      setCartItems(res.data.data as CartItem[]);
      console.debug('[Cart] loadCart: setCartItems ->', res.data.data);
    } catch (err) {
      console.error('[Cart] loadCart: failed to fetch cart', err);
      setCartItems([]);
    } finally {
      setLoading(false);
      console.debug('[Cart] loadCart: finished');
    }
  }, [isAuthenticated, token]);

  // Load cart when authentication status changes (login/logout)
  useEffect(() => {
    console.debug('[Cart] Auth status changed, reloading cart');
    loadCart().catch((e) => console.error('[Cart] loadCart on auth change failed', e));
  }, [isAuthenticated]);

  const addItem = async (item_id: string, quantity = 1) => {
    try {
      console.debug(`[Cart] addItem: Adding item ${item_id} with quantity ${quantity}`);
      const res = await addToCart(item_id, quantity);
      console.debug('[Cart] addItem: API response', res.data);
      const newItem = res.data?.data as CartItem | undefined;
      console.debug('[Cart] addItem: parsed newItem', newItem);
      if (newItem) {
        setCartItems((prev) => {
          const exists = prev.find((p) => p.item_id === newItem.item_id);
          console.debug('[Cart] addItem: item exists?', exists);
          if (exists) {
            return prev.map((p) => (p.item_id === newItem.item_id ? newItem : p));
          }
          return [...prev, newItem];
        });
      }
      // Trigger a background load to ensure server/client stay in sync
      loadCart().catch((e) => console.error('loadCart after add failed', e));
    } catch (err) {
      console.error('addItem error', err);
      throw err;
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    try {
      const res = await updateCartItem(id, quantity);
      const updated = res.data?.data as CartItem | undefined;
      if (updated) {
        setCartItems((prev) => prev.map((p) => (p.id === id ? updated : p)));
      }
      loadCart().catch((e) => console.error('loadCart after update failed', e));
    } catch (err) {
      console.error('updateQuantity error', err);
      throw err;
    }
  };

  const removeItem = async (id: string) => {
    try {
      await removeFromCart(id);
      setCartItems((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('removeItem error', err);
      throw err;
    }
  };

  const clearCart = async () => {
    await clearCartApi();
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cartItems.reduce(
    (s, i) => s + (i.items?.price ?? 0) * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{ cartItems, loading, cartCount, cartTotal, loadCart, addItem, updateQuantity, removeItem, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
