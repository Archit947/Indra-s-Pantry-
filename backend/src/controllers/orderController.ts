import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/response';
import { OrderStatus } from '../types';

const VALID_STATUSES: OrderStatus[] = [
  'placed', 'accepted', 'preparing', 'ready', 'completed', 'cancelled',
];

type CartItemWithItem = {
  id: string;
  item_id: string;
  quantity: number;
  items: {
    id: string;
    name: string;
    price: number;
    image_url?: string | null;
    is_available: boolean;
    stock: number;
  } | null;
};

type OrderSnapshotItem = {
  item_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
};

type StockMutation = {
  itemId: string;
  itemName: string;
  previousStock: number;
  nextStock: number;
};

const rollbackStockMutations = async (mutations: StockMutation[]): Promise<void> => {
  for (const mutation of [...mutations].reverse()) {
    await supabase
      .from('items')
      .update({ stock: mutation.previousStock, updated_at: new Date().toISOString() })
      .eq('id', mutation.itemId)
      .eq('stock', mutation.nextStock);
  }
};

const applyStockMutations = async (
  mutations: StockMutation[]
): Promise<{ ok: true; applied: StockMutation[] } | { ok: false; message: string }> => {
  const applied: StockMutation[] = [];

  for (const mutation of mutations) {
    const { data, error } = await supabase
      .from('items')
      .update({ stock: mutation.nextStock, updated_at: new Date().toISOString() })
      .eq('id', mutation.itemId)
      .eq('stock', mutation.previousStock)
      .select('id')
      .maybeSingle();

    if (error || !data) {
      await rollbackStockMutations(applied);
      return {
        ok: false,
        message: `Stock changed for ${mutation.itemName}. Please refresh and try again.`,
      };
    }

    applied.push(mutation);
  }

  return { ok: true, applied };
};

const parseOrderItems = (value: unknown): OrderSnapshotItem[] => {
  if (!Array.isArray(value)) return [];

  const parsedItems: OrderSnapshotItem[] = [];

  for (const entry of value) {
    const item = entry as Partial<OrderSnapshotItem>;
    const quantity = Number(item.quantity);
    const price = Number(item.price);

    if (!item.item_id || !item.name || !Number.isFinite(quantity) || quantity < 1 || !Number.isFinite(price)) {
      continue;
    }

    parsedItems.push({
      item_id: item.item_id,
      name: item.name,
      price,
      quantity,
      image_url: item.image_url ?? null,
    });
  }

  return parsedItems;
};

const buildRestockMutations = async (orderItems: OrderSnapshotItem[]): Promise<StockMutation[]> => {
  const quantitiesByItemId = new Map<string, { name: string; quantity: number }>();

  for (const item of orderItems) {
    const existing = quantitiesByItemId.get(item.item_id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      quantitiesByItemId.set(item.item_id, { name: item.name, quantity: item.quantity });
    }
  }

  const mutations: StockMutation[] = [];

  for (const [itemId, snapshot] of quantitiesByItemId.entries()) {
    const { data: currentItem } = await supabase
      .from('items')
      .select('id, name, stock')
      .eq('id', itemId)
      .maybeSingle();

    if (!currentItem) continue;

    mutations.push({
      itemId: currentItem.id,
      itemName: currentItem.name ?? snapshot.name,
      previousStock: currentItem.stock ?? 0,
      nextStock: (currentItem.stock ?? 0) + snapshot.quantity,
    });
  }

  return mutations;
};

// POST /api/orders - convert cart to order
export const placeOrder = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { notes, payment_method = 'cash_at_pickup' } = req.body;

  const { data: cartItems, error: cartError } = await supabase
    .from('cart_items')
    .select('*, items(id, name, price, image_url, is_available, stock)')
    .eq('user_id', userId);

  if (cartError || !cartItems || cartItems.length === 0) {
    sendError(res, 'Your cart is empty', 400);
    return;
  }

  const typedCartItems = cartItems as CartItemWithItem[];
  const invalidItems = typedCartItems.filter((ci) => {
    if (!ci.items) return true;
    return !ci.items.is_available || ci.items.stock < ci.quantity;
  });

  if (invalidItems.length > 0) {
    sendError(
      res,
      `Please update your cart before ordering: ${invalidItems
        .map((item) => {
          if (!item.items) return 'Unknown item';
          if (!item.items.is_available) return `${item.items.name} is not available`;
          if (item.items.stock <= 0) return `${item.items.name} is out of stock`;
          return `Only ${item.items.stock} left for ${item.items.name}`;
        })
        .join(', ')}`,
      400
    );
    return;
  }

  const stockMutations = typedCartItems.map((ci) => ({
    itemId: ci.item_id,
    itemName: ci.items!.name,
    previousStock: ci.items!.stock,
    nextStock: ci.items!.stock - ci.quantity,
  }));

  const stockResult = await applyStockMutations(stockMutations);
  if (!stockResult.ok) {
    sendError(res, stockResult.message, 400);
    return;
  }

  const orderItems = typedCartItems.map((ci) => ({
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
    await rollbackStockMutations(stockResult.applied);
    sendError(res, 'Failed to place order', 500);
    return;
  }

  await supabase.from('cart_items').delete().eq('user_id', userId);

  sendSuccess(res, order, 'Order placed successfully', 201);
};

// GET /api/orders/my - logged-in user's orders
export const getMyOrders = async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false });

  if (error) { sendError(res, 'Failed to fetch orders', 500); return; }
  sendSuccess(res, data);
};

// GET /api/orders/stats [admin]
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

// GET /api/orders [admin]
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

  if (!isAdmin) query = query.eq('user_id', req.user!.id);

  const { data, error } = await query.single();
  if (error || !data) { sendError(res, 'Order not found', 404); return; }
  sendSuccess(res, data);
};

// PATCH /api/orders/:id/status [admin]
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  const { status } = req.body;

  if (!status || !VALID_STATUSES.includes(status as OrderStatus)) {
    sendError(res, `Status must be one of: ${VALID_STATUSES.join(', ')}`, 400);
    return;
  }

  const { data: existingOrder, error: existingOrderError } = await supabase
    .from('orders')
    .select('id, status, items')
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

  let appliedRestockMutations: StockMutation[] = [];

  if (status === 'cancelled') {
    const restockMutations = await buildRestockMutations(parseOrderItems(existingOrder.items));
    if (restockMutations.length > 0) {
      const restockResult = await applyStockMutations(restockMutations);
      if (!restockResult.ok) {
        sendError(res, restockResult.message, 400);
        return;
      }
      appliedRestockMutations = restockResult.applied;
    }
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error || !data) {
    if (appliedRestockMutations.length > 0) {
      await rollbackStockMutations(appliedRestockMutations);
    }
    sendError(res, 'Order status update failed', 500);
    return;
  }

  sendSuccess(res, data, 'Order status updated');
};
