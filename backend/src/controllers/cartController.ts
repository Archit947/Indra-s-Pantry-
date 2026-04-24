import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/response';

const CART_ITEM_SELECT =
  '*, items(id, name, price, image_url, is_available, stock, categories(id, name))';

const parseQuantity = (value: unknown): number | null => {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed < 1) return null;
  return parsed;
};

// GET /api/cart
export const getCart = async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('cart_items')
    .select(CART_ITEM_SELECT)
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: true });

  if (error) { sendError(res, 'Failed to fetch cart', 500); return; }
  sendSuccess(res, data);
};

// POST /api/cart
export const addToCart = async (req: Request, res: Response): Promise<void> => {
  const { item_id, quantity = 1 } = req.body;
  const parsedQuantity = parseQuantity(quantity);

  if (!item_id) { sendError(res, 'item_id is required', 400); return; }
  if (parsedQuantity === null) { sendError(res, 'Quantity must be at least 1', 400); return; }

  const { data: item } = await supabase
    .from('items')
    .select('id, name, is_available, stock')
    .eq('id', item_id)
    .maybeSingle();

  if (!item) { sendError(res, 'Item not found', 404); return; }
  if (!item.is_available) { sendError(res, 'Item is not available right now', 400); return; }
  if (item.stock <= 0) { sendError(res, 'Item is out of stock', 400); return; }

  const { data: existingItem } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', req.user!.id)
    .eq('item_id', item_id)
    .maybeSingle();

  const finalQuantity = existingItem
    ? existingItem.quantity + parsedQuantity
    : parsedQuantity;

  if (finalQuantity > item.stock) {
    sendError(
      res,
      `Only ${item.stock} ${item.stock === 1 ? 'item is' : 'items are'} available for ${item.name}`,
      400
    );
    return;
  }

  const result = existingItem
    ? await supabase
      .from('cart_items')
      .update({ quantity: finalQuantity })
      .eq('id', existingItem.id)
      .select(CART_ITEM_SELECT)
      .single()
    : await supabase
      .from('cart_items')
      .insert({ user_id: req.user!.id, item_id, quantity: finalQuantity })
      .select(CART_ITEM_SELECT)
      .single();

  const { data, error } = result;
  if (error) {
    sendError(res, 'Failed to add to cart', 500);
    return;
  }

  sendSuccess(res, data, 'Added to cart', 201);
};

// PUT /api/cart/:id
export const updateCartItem = async (req: Request, res: Response): Promise<void> => {
  const parsedQuantity = parseQuantity(req.body.quantity);

  if (parsedQuantity === null) {
    sendError(res, 'Quantity must be at least 1', 400);
    return;
  }

  const { data: existingItem, error: existingError } = await supabase
    .from('cart_items')
    .select('id, item_id, items(id, name, is_available, stock)')
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .maybeSingle();

  if (existingError || !existingItem) {
    sendError(res, 'Cart item not found', 404);
    return;
  }

  const item = Array.isArray(existingItem.items)
    ? existingItem.items[0]
    : existingItem.items;
  if (!item) {
    sendError(res, 'This item is no longer available', 400);
    return;
  }

  if (!item.is_available) {
    sendError(res, 'This item is not available right now', 400);
    return;
  }

  if (item.stock <= 0) {
    sendError(res, 'This item is out of stock', 400);
    return;
  }

  if (parsedQuantity > item.stock) {
    sendError(
      res,
      `Only ${item.stock} ${item.stock === 1 ? 'item is' : 'items are'} available for ${item.name}`,
      400
    );
    return;
  }

  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity: parsedQuantity })
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .select(CART_ITEM_SELECT)
    .single();

  if (error || !data) { sendError(res, 'Cart item not found', 404); return; }
  sendSuccess(res, data, 'Cart updated');
};

// DELETE /api/cart/clear - must be registered BEFORE /:id
export const clearCart = async (req: Request, res: Response): Promise<void> => {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', req.user!.id);

  if (error) { sendError(res, 'Failed to clear cart', 500); return; }
  sendSuccess(res, null, 'Cart cleared');
};

// DELETE /api/cart/:id
export const removeFromCart = async (req: Request, res: Response): Promise<void> => {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id);

  if (error) { sendError(res, 'Failed to remove item', 500); return; }
  sendSuccess(res, null, 'Item removed from cart');
};
