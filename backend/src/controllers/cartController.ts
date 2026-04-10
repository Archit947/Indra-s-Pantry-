import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/response';

// GET /api/cart
export const getCart = async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('cart_items')
    .select('*, items(id, name, price, image_url, is_available, categories(id, name))')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: true });

  if (error) { sendError(res, 'Failed to fetch cart', 500); return; }
  sendSuccess(res, data);
};

// POST /api/cart
export const addToCart = async (req: Request, res: Response): Promise<void> => {
  const { item_id, quantity = 1 } = req.body;
  console.log('[addToCart] Request body:', { item_id, quantity, user_id: req.user?.id });

  if (!item_id) { sendError(res, 'item_id is required', 400); return; }

  // Verify item exists and is available
  const { data: item } = await supabase
    .from('items')
    .select('id, is_available')
    .eq('id', item_id)
    .maybeSingle();

  console.log('[addToCart] Item lookup result:', { item });
  if (!item) { sendError(res, 'Item not found', 404); return; }
  if (!item.is_available) { sendError(res, 'Item is out of stock', 400); return; }

  // Check if item already in cart
  const { data: existingItem } = await supabase
    .from('cart_items')
    .select('id')
    .eq('user_id', req.user!.id)
    .eq('item_id', item_id)
    .maybeSingle();

  let result;
  if (existingItem) {
    // Update existing cart item
    result = await supabase
      .from('cart_items')
      .update({ quantity: parseInt(String(quantity), 10) })
      .eq('id', existingItem.id)
      .select('*, items(id, name, price, image_url, is_available, categories(id, name))')
      .single();
  } else {
    // Insert new cart item
    result = await supabase
      .from('cart_items')
      .insert({ user_id: req.user!.id, item_id, quantity: parseInt(String(quantity), 10) })
      .select('*, items(id, name, price, image_url, is_available, categories(id, name))')
      .single();
  }

  const { data, error } = result;
  console.log('[addToCart] Result:', { error, data });
  if (error) {
    console.error('[addToCart] Error:', error);
    sendError(res, 'Failed to add to cart', 500);
    return;
  }
  console.log('[addToCart] Success, returning data:', data);
  sendSuccess(res, data, 'Added to cart', 201);
};

// PUT /api/cart/:id  — update quantity
export const updateCartItem = async (req: Request, res: Response): Promise<void> => {
  const { quantity } = req.body;

  if (!quantity || parseInt(String(quantity), 10) < 1) {
    sendError(res, 'Quantity must be at least 1', 400);
    return;
  }

  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity: parseInt(String(quantity), 10) })
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .select('*, items(id, name, price, image_url, is_available, categories(id, name))')
    .single();

  if (error || !data) { sendError(res, 'Cart item not found', 404); return; }
  sendSuccess(res, data, 'Cart updated');
};

// DELETE /api/cart/clear  — must be registered BEFORE /:id
export const clearCart = async (req: Request, res: Response): Promise<void> => {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', req.user!.id);

  if (error) { sendError(res, 'Failed to clear cart', 500); return; }
  sendSuccess(res, null, 'Cart cleared');
};

// DELETE /api/cart/:id  — remove single item
export const removeFromCart = async (req: Request, res: Response): Promise<void> => {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id);

  if (error) { sendError(res, 'Failed to remove item', 500); return; }
  sendSuccess(res, null, 'Item removed from cart');
};
