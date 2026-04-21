import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/response';
import { OrderStatus } from '../types';

const VALID_STATUSES: OrderStatus[] = [
  'placed', 'accepted', 'preparing', 'ready', 'completed', 'cancelled',
];

// POST /api/orders  — convert cart to order
export const placeOrder = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { notes, payment_method = 'cash_at_pickup' } = req.body;

  // Fetch user's current cart with item details
  const { data: cartItems, error: cartError } = await supabase
    .from('cart_items')
    .select('*, items(id, name, price, image_url, is_available)')
    .eq('user_id', userId);

  if (cartError || !cartItems || cartItems.length === 0) {
    sendError(res, 'Your cart is empty', 400);
    return;
  }

  // Check all items are still available
  const unavailable = cartItems.filter((ci) => !ci.items?.is_available);
  if (unavailable.length > 0) {
    sendError(
      res,
      `Some items are no longer available: ${unavailable.map((i) => i.items?.name).join(', ')}`,
      400
    );
    return;
  }

  // Build order snapshot (prices captured at order time)
  const orderItems = cartItems.map((ci) => ({
    item_id: ci.item_id,
    name: ci.items!.name,
    price: ci.items!.price,
    quantity: ci.quantity,
    image_url: ci.items!.image_url || null,
  }));

  const totalAmount = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Insert order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      items: orderItems,
      total_amount: totalAmount,
      status: 'placed',
      payment_method,
      notes: notes?.trim() || null,
    })
    .select()
    .single();

  if (orderError || !order) {
    sendError(res, 'Failed to place order', 500);
    return;
  }

  // Clear cart after successful order
  await supabase.from('cart_items').delete().eq('user_id', userId);

  sendSuccess(res, order, 'Order placed successfully', 201);
};

// GET /api/orders/my — logged-in user's orders
export const getMyOrders = async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false });

  if (error) { sendError(res, 'Failed to fetch orders', 500); return; }
  sendSuccess(res, data);
};

// GET /api/orders/stats  [admin]
export const getOrderStats = async (_req: Request, res: Response): Promise<void> => {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('status, total_amount');

  if (error) { sendError(res, 'Failed to fetch stats', 500); return; }

  const stats = {
    total: orders?.length ?? 0,
    placed: orders?.filter((o) => o.status === 'placed').length ?? 0,
    accepted: orders?.filter((o) => o.status === 'accepted').length ?? 0,
    preparing: orders?.filter((o) => o.status === 'preparing').length ?? 0,
    ready: orders?.filter((o) => o.status === 'ready').length ?? 0,
    completed: orders?.filter((o) => o.status === 'completed').length ?? 0,
    cancelled: orders?.filter((o) => o.status === 'cancelled').length ?? 0,
    totalRevenue: orders?.reduce((s, o) => s + (o.total_amount ?? 0), 0) ?? 0,
  };

  sendSuccess(res, stats);
};

// GET /api/orders  [admin]
export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  const { status } = req.query;

  let query = supabase
    .from('orders')
    .select('*, users(id, name, email, phone)')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status as string);

  const { data, error } = await query;
  if (error) { sendError(res, 'Failed to fetch orders', 500); return; }
  sendSuccess(res, data);
};

// GET /api/orders/:id
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  const isAdmin = req.user!.role === 'admin';

  let query = supabase
    .from('orders')
    .select('*, users(id, name, email, phone)')
    .eq('id', req.params.id);

  // Non-admins can only see their own orders
  if (!isAdmin) query = query.eq('user_id', req.user!.id);

  const { data, error } = await query.single();
  if (error || !data) { sendError(res, 'Order not found', 404); return; }
  sendSuccess(res, data);
};

// PATCH /api/orders/:id/status  [admin]
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  const { status } = req.body;

  if (!status || !VALID_STATUSES.includes(status as OrderStatus)) {
    sendError(res, `Status must be one of: ${VALID_STATUSES.join(', ')}`, 400);
    return;
  }

  const { data: existingOrder, error: existingOrderError } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', req.params.id)
    .maybeSingle();

  if (existingOrderError || !existingOrder) {
    sendError(res, 'Order not found', 404);
    return;
  }

  if (existingOrder.status === 'completed' || existingOrder.status === 'cancelled') {
    sendError(res, 'Finalized orders cannot be updated', 400);
    return;
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error || !data) { sendError(res, 'Order status update failed', 500); return; }
  sendSuccess(res, data, 'Order status updated');
};
